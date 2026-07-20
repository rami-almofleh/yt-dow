import fs from 'node:fs';

import { Router } from 'express';

import { config } from '../config.mjs';
import { HttpError } from '../middleware/errorHandler.mjs';
import { convertAudioStream } from '../services/convert.service.mjs';
import { detectPlatform } from '../services/platform.service.mjs';
import { downloadMergedVideo, mapYtDlpError, streamBestAudio } from '../services/ytdlp.service.mjs';

export const downloadRouter = Router();

const AUDIO_CONTENT_TYPES = { mp3: 'audio/mpeg', wav: 'audio/wav' };

function sanitizeFilename(title) {
  const cleaned = String(title ?? '')
    .replace(/[^\p{L}\p{N}\-_. ]/gu, '')
    .trim()
    .slice(0, 80);
  return cleaned || 'download';
}

// Content-Disposition header values must be Latin-1 - a Unicode title (e.g.
// Arabic) would otherwise make res.setHeader throw ERR_INVALID_CHAR. We send
// an ASCII-only fallback via filename= and the full Unicode title via the
// RFC 5987 filename*= parameter, which browsers use when present.
function buildContentDisposition(title, extension) {
  const base = sanitizeFilename(title);
  const asciiFallback = (base.replace(/[^\x20-\x7E]/g, '').trim() || 'download').slice(0, 80);
  const encodedName = encodeURIComponent(`${base}.${extension}`);
  return `attachment; filename="${asciiFallback}.${extension}"; filename*=UTF-8''${encodedName}`;
}

// Cuts the connection instead of trying to send a JSON error body once
// streaming has already started (headers/bytes sent) - see errorHandler.mjs
// for why that's the only option at that point.
function failDownload(res, next, err) {
  if (res.headersSent) {
    res.destroy();
  } else {
    next(err);
  }
}

async function handleVideoDownload(req, res, next, { url, title }) {
  const heightParam = req.query.height;
  const height = heightParam && heightParam !== 'best' ? Number(heightParam) : null;
  if (heightParam && heightParam !== 'best' && !Number.isFinite(height)) {
    throw new HttpError(400, 'Der Parameter "height" muss eine Zahl oder "best" sein.', 'INVALID_HEIGHT');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.downloadTimeoutMs);
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });

  let tempFilePath;
  try {
    tempFilePath = await downloadMergedVideo({ url, height, signal: controller.signal });
  } catch (err) {
    return next(err);
  } finally {
    clearTimeout(timeout);
  }

  res.setHeader('Content-Disposition', buildContentDisposition(title, 'mp4'));
  res.setHeader('Content-Type', 'video/mp4');

  const readStream = fs.createReadStream(tempFilePath);
  const cleanupTempFile = () => fs.promises.unlink(tempFilePath).catch(() => {});

  readStream.on('close', cleanupTempFile);
  readStream.on('error', (err) => {
    cleanupTempFile();
    failDownload(res, next, err);
  });
  res.on('close', () => readStream.destroy());

  readStream.pipe(res);
}

function handleAudioDownload(req, res, next, { url, title, format }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.downloadTimeoutMs);

  const ytdlpStream = streamBestAudio(url, controller.signal);
  const ffmpeg = convertAudioStream(ytdlpStream, format);

  // yt-dlp-wrap kills the yt-dlp process itself on abort, but our own ffmpeg
  // process (spawned separately, not through yt-dlp) needs an explicit kill
  // too - otherwise it keeps transcoding into a broken pipe after a client
  // disconnect.
  res.on('close', () => {
    clearTimeout(timeout);
    if (!res.writableFinished) {
      controller.abort();
      ffmpeg.kill();
    }
  });

  ytdlpStream.on('error', (err) => {
    ffmpeg.kill();
    if (controller.signal.aborted) {
      return failDownload(res, next, new HttpError(499, 'Download wurde abgebrochen.', 'CANCELLED'));
    }
    const mapped = mapYtDlpError(err);
    failDownload(res, next, new HttpError(422, mapped.message, mapped.code));
  });

  let stderr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  ffmpeg.on('error', (err) => failDownload(res, next, err));
  ffmpeg.on('close', (code) => {
    clearTimeout(timeout);
    if (code !== 0 && !res.writableFinished) {
      console.error(`ffmpeg beendete sich mit Code ${code}: ${stderr.slice(-500)}`);
      failDownload(res, next, new HttpError(502, 'Audio-Konvertierung fehlgeschlagen.', 'CONVERSION_FAILED'));
    }
  });

  res.setHeader('Content-Disposition', buildContentDisposition(title, format));
  res.setHeader('Content-Type', AUDIO_CONTENT_TYPES[format]);

  ffmpeg.stdout.pipe(res);
}

downloadRouter.get('/download', async (req, res, next) => {
  try {
    const { url, format, title } = req.query;

    if (typeof url !== 'string' || url.trim() === '') {
      throw new HttpError(400, 'Der Query-Parameter "url" ist erforderlich.', 'MISSING_URL');
    }
    if (format !== 'mp4' && format !== 'mp3' && format !== 'wav') {
      throw new HttpError(400, 'Der Parameter "format" muss mp4, mp3 oder wav sein.', 'INVALID_FORMAT');
    }

    detectPlatform(url);

    if (format === 'mp4') {
      await handleVideoDownload(req, res, next, { url, title });
    } else {
      handleAudioDownload(req, res, next, { url, title, format });
    }
  } catch (err) {
    next(err);
  }
});
