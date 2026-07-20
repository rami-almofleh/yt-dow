import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import YTDlpWrapModule from 'yt-dlp-wrap';

import { config } from '../config.mjs';
import { HttpError } from '../middleware/errorHandler.mjs';

// yt-dlp-wrap is CommonJS; Node's ESM interop surfaces its `export default`
// as `.default` on the imported object instead of unwrapping it directly.
const YTDlpWrap = YTDlpWrapModule.default ?? YTDlpWrapModule;
const ytDlpWrap = new YTDlpWrap();

const INFO_TIMEOUT_MS = 20_000;

function mapYtDlpError(err) {
  const message = String(err?.message ?? err ?? '');
  if (/private|login|rate.?limit|restricted|sign in|cookies/i.test(message)) {
    return {
      code: 'AUTH_REQUIRED',
      message:
        'Dieses Video ist privat, eingeschränkt oder erfordert eine Anmeldung und kann daher nicht heruntergeladen werden.',
    };
  }
  // Beobachtetes, reproduzierbares Verhalten: YouTubes Anti-Bot-Schutz lehnt die
  // signierten CDN-URLs gelegentlich mit 403 ab, auch bei völlig öffentlichen
  // Videos - unabhängig vom Nutzer, meist durch erneuten Versuch behebbar.
  if (/403|forbidden|unable to download video data/i.test(message)) {
    return {
      code: 'BLOCKED_BY_PLATFORM',
      message: 'Die Plattform hat die Anfrage kurzfristig blockiert (Anti-Bot-Schutz). Bitte in ein paar Sekunden erneut versuchen.',
    };
  }
  if (/unsupported url|is not a valid url|no video formats/i.test(message)) {
    return {
      code: 'UNSUPPORTED_URL',
      message: 'Dieser Link wird nicht unterstützt oder enthält kein abspielbares Video.',
    };
  }
  if (/video unavailable|has been removed|does not exist|404/i.test(message)) {
    return { code: 'VIDEO_UNAVAILABLE', message: 'Dieses Video ist nicht mehr verfügbar.' };
  }
  return { code: 'UNKNOWN_YTDLP_ERROR', message: 'Video-Informationen konnten nicht abgerufen werden.' };
}

// libmp3lame mit "-qscale:a 2" (siehe convert.service.mjs) ist VBR, liefert also
// keine feste Bitrate - das hier ist nur ein grober Erfahrungswert für die
// Größenschätzung, keine exakte Angabe.
const MP3_AVERAGE_BITRATE_BPS = 192_000;

function getFilesize(format) {
  return format?.filesize ?? format?.filesize_approx ?? null;
}

// Für die Downloadgrößen-Schätzung brauchen wir eine Referenz-Audiospur: dieselbe,
// die buildVideoFormatSelector() für den echten Merge bevorzugen würde (mp4a),
// sonst würde die Schätzung nicht zur tatsächlich gelieferten Datei passen.
function pickReferenceAudioFormat(formats) {
  const audioOnly = formats.filter((f) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
  if (audioOnly.length === 0) return null;
  return audioOnly.find((f) => f.acodec?.startsWith('mp4a')) ?? audioOnly[0];
}

function toVideoQualities(formats, referenceAudio) {
  const byHeight = new Map();
  for (const format of formats) {
    // Nur echte video-only Formate (acodec 'none') betrachten - das ist exakt,
    // was buildVideoFormatSelector()s "bv*" auswählt. Kombinierte HLS-Formate
    // (z. B. itag 92 bei YouTube) haben denselben avc1-Codec, aber praktisch
    // nie eine filesize-Angabe - würden sie mitzählen, bekämen genau die
    // Höhen, die wir hier anzeigen, fälschlich "keine Größe verfügbar".
    const isVideoOnly = (!format.acodec || format.acodec === 'none') && format.vcodec && format.vcodec !== 'none';
    if (isVideoOnly && typeof format.height === 'number') {
      const existing = byHeight.get(format.height);
      const isAvc1 = format.vcodec.startsWith('avc1');
      if (!existing || (isAvc1 && !existing.vcodec.startsWith('avc1'))) {
        byHeight.set(format.height, format);
      }
    }
  }

  const audioFilesize = getFilesize(referenceAudio);

  return [...byHeight.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([height, format]) => {
      const videoFilesize = getFilesize(format);
      const estimatedBytes =
        videoFilesize != null && audioFilesize != null ? videoFilesize + audioFilesize : null;
      return { id: `${height}p`, height, label: `${height}p`, estimatedBytes };
    });
}

function estimateAudioOutputSizes(durationSeconds, referenceAudio) {
  if (typeof durationSeconds !== 'number') {
    return { mp3: null, wav: null };
  }
  // convert.service.mjs setzt für WAV kein -ar/-ac, ffmpeg übernimmt also
  // Samplerate/Kanalzahl der Quelle 1:1 (PCM 16-bit ist ffmpegs Vorgabe für "-f wav") -
  // Fallback 48kHz/Stereo nur falls yt-dlp dazu keine Angabe liefert.
  const sampleRate = referenceAudio?.asr ?? 48_000;
  const channels = referenceAudio?.audio_channels ?? 2;
  return {
    mp3: Math.round((MP3_AVERAGE_BITRATE_BPS / 8) * durationSeconds),
    wav: Math.round(sampleRate * channels * 2 * durationSeconds),
  };
}

function toVideoInfo(raw, platform, sourceUrl) {
  const formats = Array.isArray(raw.formats) ? raw.formats : [];
  const referenceAudio = pickReferenceAudioFormat(formats);
  const videoQualities = toVideoQualities(formats, referenceAudio);
  const audioSizes = estimateAudioOutputSizes(raw.duration, referenceAudio);

  return {
    platform: platform.id,
    platformLabel: platform.label,
    sourceUrl,
    title: raw.title ?? 'Unbenanntes Video',
    thumbnailUrl: raw.thumbnail ?? null,
    durationSeconds: typeof raw.duration === 'number' ? raw.duration : null,
    videoQualities:
      videoQualities.length > 0
        ? videoQualities
        : [{ id: 'best', height: null, label: 'Beste verfügbare Qualität', estimatedBytes: null }],
    // Audio-Extraktion via ffmpeg ist unabhängig von der Video-Qualität immer möglich,
    // solange überhaupt ein abspielbares Format existiert.
    audioFormats: [
      { id: 'mp3', label: 'MP3 (Audio)', estimatedBytes: audioSizes.mp3 },
      { id: 'wav', label: 'WAV (Audio, verlustfrei)', estimatedBytes: audioSizes.wav },
    ],
  };
}

export async function fetchVideoInfo(url, platform) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INFO_TIMEOUT_MS);

  let stdout;
  try {
    stdout = await ytDlpWrap.execPromise(
      [url, '--dump-json', '--no-playlist', '--no-warnings', '--socket-timeout', '15'],
      {},
      controller.signal,
    );
  } catch (err) {
    if (controller.signal.aborted) {
      throw new HttpError(504, 'Zeitüberschreitung beim Abrufen der Video-Informationen.', 'TIMEOUT');
    }
    const mapped = mapYtDlpError(err);
    throw new HttpError(422, mapped.message, mapped.code);
  } finally {
    clearTimeout(timeout);
  }

  let raw;
  try {
    raw = JSON.parse(stdout);
  } catch {
    throw new HttpError(502, 'Antwort des Downloaders konnte nicht gelesen werden.', 'BAD_UPSTREAM_RESPONSE');
  }

  return toVideoInfo(raw, platform, url);
}

function buildVideoFormatSelector(height) {
  const maxHeight = height ? `[height<=${height}]` : '';
  // Prefer H.264 video + AAC audio (avc1/mp4a) for maximum player
  // compatibility, with progressively looser fallbacks for platforms that
  // don't expose separate avc1 renditions (TikTok/Instagram/Facebook
  // typically hand back a single combined format anyway).
  return [
    `bv*[vcodec^=avc1]${maxHeight}+ba[acodec^=mp4a]`,
    `bv*${maxHeight}+ba`,
    `b[vcodec^=avc1]${maxHeight}`,
    `b${maxHeight}`,
  ].join('/');
}

/**
 * Downloads and merges video+audio into a real MP4 file on disk.
 *
 * This intentionally does NOT stream straight to stdout: verified against a
 * live video that piping a merge through `-o -` makes ffmpeg fall back to an
 * MPEG-TS container (MP4's moov atom needs a seekable output), which some
 * players/importers won't accept despite the `.mp4` extension. Writing to a
 * temp file first is the only way to get a genuinely valid MP4. The caller
 * owns the returned path and must delete it once it's done streaming it out.
 */
export async function downloadMergedVideo({ url, height, signal }) {
  const tempFilePath = path.join(os.tmpdir(), `amapin-${randomUUID()}.mp4`);
  const selector = buildVideoFormatSelector(height);

  try {
    await ytDlpWrap.execPromise(
      [
        url,
        '-f',
        selector,
        '--merge-output-format',
        'mp4',
        '--ffmpeg-location',
        config.ffmpegPath,
        '-o',
        tempFilePath,
        '--no-playlist',
        '--no-warnings',
        '--socket-timeout',
        '15',
        // yt-dlp's default silently skips DASH fragments that fail after
        // retries (e.g. a transient anti-bot 403 on one fragment) and still
        // exits 0, producing a shorter-but-valid file with no error at all.
        // We'd rather surface a real error than hand back a randomly
        // truncated download.
        '--no-skip-unavailable-fragments',
        '--fragment-retries',
        '20',
      ],
      {},
      signal,
    );
  } catch (err) {
    await fs.promises.unlink(tempFilePath).catch(() => {});
    if (signal?.aborted) {
      throw new HttpError(499, 'Download wurde abgebrochen.', 'CANCELLED');
    }
    const mapped = mapYtDlpError(err);
    throw new HttpError(422, mapped.message, mapped.code);
  }

  return tempFilePath;
}

/**
 * Streams the best available audio track as-is (no re-encoding) so it can be
 * piped into ffmpeg for mp3/wav conversion without ever touching disk.
 */
export function streamBestAudio(url, signal) {
  return ytDlpWrap.execStream(
    [
      url,
      '-f',
      'bestaudio/best',
      '-o',
      '-',
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout',
      '15',
      // See downloadMergedVideo() above: without this, a fragment that fails
      // (e.g. a transient anti-bot 403) is silently dropped and the process
      // still exits 0, so the audio just comes out shorter every time -
      // never a fixed length, never an error.
      '--no-skip-unavailable-fragments',
      '--fragment-retries',
      '20',
    ],
    {},
    signal,
  );
}

export { mapYtDlpError };
