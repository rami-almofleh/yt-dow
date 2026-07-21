import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { app, BrowserWindow, dialog } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Same source image electron-builder.yml uses to generate the packaged
// app's .icns/.ico - also applied here so the unpackaged dev app (npm run
// electron:dev) shows the real icon instead of Electron's default one.
const ICON_PATH = path.join(__dirname, '..', 'public', 'logo.png');

// Bundled per-platform yt-dlp/ffmpeg/deno binaries (see scripts/fetch-binaries.mjs).
// Must be set before importing server/index.mjs, since config.mjs reads these
// env vars at module-load time.
const binDir = app.isPackaged
  ? path.join(process.resourcesPath, 'bin', `${process.platform}-${process.arch}`)
  : path.join(__dirname, '..', 'resources', 'bin', `${process.platform}-${process.arch}`);
const exe = (name) => path.join(binDir, process.platform === 'win32' ? `${name}.exe` : name);

process.env.YTDLP_PATH = exe('yt-dlp');
process.env.FFMPEG_PATH = exe('ffmpeg');
process.env.DENO_PATH = exe('deno');
process.env.APP_MODE = 'desktop';
process.env.PORT = '0';
process.env.HOST = '127.0.0.1';

process.on('uncaughtException', (err) => {
  console.error(err);
  dialog.showErrorBox('Unerwarteter Fehler', err.stack ?? String(err));
});
process.on('unhandledRejection', (err) => {
  console.error(err);
  dialog.showErrorBox('Unerwarteter Fehler', err?.stack ?? String(err));
});

let mainWindow;

async function createWindow() {
  const { server } = await import('../server/index.mjs');
  // Dynamic import() only awaits the module's synchronous top-level
  // evaluation, not the async 'listening' event app.listen() fires later -
  // server.address() would otherwise read as null here.
  if (!server.listening) {
    await new Promise((resolve) => server.once('listening', resolve));
  }
  const { port } = server.address();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  mainWindow.on('closed', () => {
    mainWindow = null;
    server.close();
  });
}

app.whenReady().then(() => {
  // BrowserWindow's `icon` option doesn't affect the macOS Dock tile - only
  // packaged .app bundles pick that up automatically from the .icns baked in
  // by electron-builder. Setting it explicitly here covers the unpackaged
  // dev run (npm run electron:dev) too. Requires the app to be ready.
  app.dock?.setIcon(ICON_PATH);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
