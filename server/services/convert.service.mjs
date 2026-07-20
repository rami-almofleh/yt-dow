import { spawn } from 'node:child_process';

import { config } from '../config.mjs';

const AUDIO_CODEC_ARGS = {
  // Constant bitrate, not VBR (-qscale:a): a VBR encode needs an accurate
  // Xing header to report its real duration, which requires seeking back
  // after encoding - impossible once the output is piped straight to the HTTP
  // response instead of a seekable file. Verified against a live download
  // that VBR output here still contains the full, correct audio (decodes to
  // the right length) but every player/prober misreports its total duration,
  // since duration = filesize / bitrate only holds for CBR.
  mp3: ['-f', 'mp3', '-codec:a', 'libmp3lame', '-b:a', '192k'],
  // ffmpeg writes a streaming-friendly WAV header (size field left open) when
  // the output is a pipe rather than a seekable file - verified this still
  // produces a valid, playable WAV.
  wav: ['-f', 'wav'],
};

/**
 * Runs a downloaded audio file through ffmpeg to convert it to mp3/wav.
 * Returns the spawned ffmpeg process; the caller pipes `.stdout` to the HTTP
 * response and should inspect `.stderr` / the `close` exit code on failure.
 *
 * Reads from a real file (not a live stdin pipe) - see downloadBestAudio() in
 * ytdlp.service.mjs for why piping yt-dlp straight into ffmpeg's stdin is
 * unreliable.
 */
export function convertAudioFile(inputFilePath, format) {
  const codecArgs = AUDIO_CODEC_ARGS[format];
  if (!codecArgs) {
    throw new Error(`Nicht unterstütztes Audioformat: ${format}`);
  }

  return spawn(config.ffmpegPath, ['-i', inputFilePath, '-vn', ...codecArgs, 'pipe:1']);
}
