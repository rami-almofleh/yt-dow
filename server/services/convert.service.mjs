import { spawn } from 'node:child_process';

import { config } from '../config.mjs';

const AUDIO_CODEC_ARGS = {
  mp3: ['-f', 'mp3', '-codec:a', 'libmp3lame', '-qscale:a', '2'],
  // ffmpeg writes a streaming-friendly WAV header (size field left open) when
  // the output is a pipe rather than a seekable file - verified this still
  // produces a valid, playable WAV.
  wav: ['-f', 'wav'],
};

/**
 * Pipes a raw audio stream (as produced by yt-dlp) through ffmpeg to convert
 * it to mp3/wav on the fly. Returns the spawned ffmpeg process; the caller
 * pipes `.stdout` to the HTTP response and should inspect `.stderr` /
 * the `close` exit code on failure.
 */
export function convertAudioStream(inputStream, format) {
  const codecArgs = AUDIO_CODEC_ARGS[format];
  if (!codecArgs) {
    throw new Error(`Nicht unterstütztes Audioformat: ${format}`);
  }

  const ffmpeg = spawn(config.ffmpegPath, ['-i', 'pipe:0', '-vn', ...codecArgs, 'pipe:1']);

  // If ffmpeg exits early (e.g. yt-dlp sent garbage), writes to its closed
  // stdin would otherwise throw an unhandled EPIPE.
  ffmpeg.stdin.on('error', () => {});
  inputStream.on('error', () => ffmpeg.stdin.destroy());
  inputStream.pipe(ffmpeg.stdin);

  return ffmpeg;
}
