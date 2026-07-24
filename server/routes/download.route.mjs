import fs from 'node:fs';

import { Router } from 'express';

import { config } from '../config.mjs';
import { HttpError } from '../middleware/errorHandler.mjs';
import { convertAudioFile } from '../services/convert.service.mjs';
import { detectPlatform } from '../services/platform.service.mjs';
import * as progress from '../services/progress.service.mjs';
import { downloadBestAudio, downloadMergedVideo } from '../services/ytdlp.service.mjs';

export const downloadRouter = Router();

// Mounted separately in server/index.mjs, deliberately outside the download
// rate limiter (10 requests/10min in server mode) - a client polling this
// every second for the duration of one download would blow through that
// budget almost immediately. It's a cheap in-memory read with no side
// effects, same trust level as healthRouter.
export const downloadProgressRouter = Router();
downloadProgressRouter.get('/download-progress/:jobId', (req, res) => {
  res.json({ job: progress.getJob(req.params.jobId) });
});

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

// yt-dlp reports percent/speed/eta per download stream (0-100 for the video
// track, then again 0-100 for the audio track when merging) - forwarding it
// as-is instead of trying to blend both into one smooth 0-100 run, since
// there's no reliable combined total to compute that from.
function onDlProgress(jobId) {
  if (!jobId) return undefined;
  return (p) => progress.updateJob(jobId, { phase: 'downloading', percent: p.percent ?? null, speed: p.currentSpeed ?? null, eta: p.eta ?? null });
}

async function handleVideoDownload(req, res, next, { url, title, jobId }) {
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
    tempFilePath = await downloadMergedVideo({
      url,
      height,
      signal: controller.signal,
      onProgress: onDlProgress(jobId),
    });
  } catch (err) {
    if (jobId) progress.endJob(jobId);
    return next(err);
  } finally {
    clearTimeout(timeout);
  }
  if (jobId) progress.updateJob(jobId, { phase: 'finalizing', percent: 100 });

  res.setHeader('Content-Disposition', buildContentDisposition(title, 'mp4'));
  res.setHeader('Content-Type', 'video/mp4');

  const readStream = fs.createReadStream(tempFilePath);
  const cleanupTempFile = () => fs.promises.unlink(tempFilePath).catch(() => {});

  readStream.on('close', () => {
    cleanupTempFile();
    if (jobId) progress.endJob(jobId);
  });
  readStream.on('error', (err) => {
    cleanupTempFile();
    if (jobId) progress.endJob(jobId);
    failDownload(res, next, err);
  });
  res.on('close', () => readStream.destroy());

  readStream.pipe(res);
}

async function handleAudioDownload(req, res, next, { url, title, format, jobId }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.downloadTimeoutMs);
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });

  let tempFilePath;
  try {
    tempFilePath = await downloadBestAudio({ url, signal: controller.signal, onProgress: onDlProgress(jobId) });
  } catch (err) {
    if (jobId) progress.endJob(jobId);
    return next(err);
  } finally {
    clearTimeout(timeout);
  }
  if (jobId) progress.updateJob(jobId, { phase: 'finalizing', percent: 100 });
  const cleanupTempFile = () => fs.promises.unlink(tempFilePath).catch(() => {});

  const ffmpeg = convertAudioFile(tempFilePath, format);

  // The download timeout above only covers the yt-dlp step; ffmpeg itself
  // still needs an explicit kill on client disconnect, otherwise it keeps
  // transcoding into a broken pipe.
  res.on('close', () => {
    if (!res.writableFinished) ffmpeg.kill();
  });

  let stderr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  ffmpeg.on('error', (err) => {
    cleanupTempFile();
    if (jobId) progress.endJob(jobId);
    failDownload(res, next, err);
  });
  ffmpeg.on('close', (code) => {
    cleanupTempFile();
    if (jobId) progress.endJob(jobId);
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
  const { jobId } = req.query;
  try {
    const { url, format, title } = req.query;

    if (typeof url !== 'string' || url.trim() === '') {
      throw new HttpError(400, 'Der Query-Parameter "url" ist erforderlich.', 'MISSING_URL');
    }
    if (format !== 'mp4' && format !== 'mp3' && format !== 'wav') {
      throw new HttpError(400, 'Der Parameter "format" muss mp4, mp3 oder wav sein.', 'INVALID_FORMAT');
    }

    detectPlatform(url);
    if (jobId) progress.startJob(jobId);

    if (format === 'mp4') {
      await handleVideoDownload(req, res, next, { url, title, jobId });
    } else {
      await handleAudioDownload(req, res, next, { url, title, format, jobId });
    }
  } catch (err) {
    if (jobId) progress.endJob(jobId);
    next(err);
  }
});
