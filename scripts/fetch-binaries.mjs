#!/usr/bin/env node
// Downloads yt-dlp, ffmpeg, and Deno binaries for every Electron packaging
// target into resources/bin/<platform>-<arch>/ - run manually before
// packaging (`npm run fetch:binaries`), not part of the app's own build.
// electron/main.mjs resolves the exact same `${process.platform}-${process.arch}`
// key at runtime to find the bundled binaries.
import { chmodSync, createWriteStream, mkdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';

import extractZip from 'extract-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_DIR = path.join(__dirname, '..', 'resources', 'bin');

const YTDLP_BASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';
const DENO_BASE = 'https://github.com/denoland/deno/releases/latest/download';
// Pinned tag, matching the release ffmpeg-static's own installer resolves to
// (see node_modules/ffmpeg-static/package.json -> "binary-release-tag").
const FFMPEG_BASE = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1';

const TARGETS = [
  { key: 'darwin-x64', ytdlp: 'yt-dlp_macos', deno: 'deno-x86_64-apple-darwin.zip', ffmpeg: 'darwin-x64' },
  { key: 'darwin-arm64', ytdlp: 'yt-dlp_macos', deno: 'deno-aarch64-apple-darwin.zip', ffmpeg: 'darwin-arm64' },
  { key: 'win32-x64', ytdlp: 'yt-dlp.exe', deno: 'deno-x86_64-pc-windows-msvc.zip', ffmpeg: 'win32-x64' },
  { key: 'linux-x64', ytdlp: 'yt-dlp_linux', deno: 'deno-x86_64-unknown-linux-gnu.zip', ffmpeg: 'linux-x64' },
];

// Optional CLI filter, e.g. `node scripts/fetch-binaries.mjs darwin-arm64,darwin-x64`
const requested = process.argv[2]?.split(',');
const targets = requested ? TARGETS.filter((t) => requested.includes(t.key)) : TARGETS;
if (targets.length === 0) {
  throw new Error(`No matching targets for "${process.argv[2]}". Known: ${TARGETS.map((t) => t.key).join(', ')}`);
}

async function download(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  await pipeline(res.body, createWriteStream(destPath));
}

async function downloadGunzipped(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  await pipeline(res.body, createGunzip(), createWriteStream(destPath));
}

for (const target of targets) {
  const dir = path.join(BIN_DIR, target.key);
  mkdirSync(dir, { recursive: true });
  const isWin = target.key.startsWith('win32');
  const exe = (name) => path.join(dir, isWin ? `${name}.exe` : name);

  console.log(`[${target.key}] yt-dlp...`);
  await download(`${YTDLP_BASE}/${target.ytdlp}`, exe('yt-dlp'));
  if (!isWin) chmodSync(exe('yt-dlp'), 0o755);

  console.log(`[${target.key}] ffmpeg...`);
  await downloadGunzipped(`${FFMPEG_BASE}/ffmpeg-${target.ffmpeg}.gz`, exe('ffmpeg'));
  if (!isWin) chmodSync(exe('ffmpeg'), 0o755);

  console.log(`[${target.key}] deno...`);
  const zipPath = path.join(dir, 'deno.zip');
  await download(`${DENO_BASE}/${target.deno}`, zipPath);
  await extractZip(zipPath, { dir });
  rmSync(zipPath);
  const extractedDeno = path.join(dir, isWin ? 'deno.exe' : 'deno');
  if (extractedDeno !== exe('deno')) renameSync(extractedDeno, exe('deno'));
  if (!isWin) chmodSync(exe('deno'), 0o755);

  console.log(`[${target.key}] done.`);
}

console.log(`Fetched binaries for: ${targets.map((t) => t.key).join(', ')}`);
