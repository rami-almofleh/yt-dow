import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { app, BrowserWindow, Menu, dialog, shell } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Same source image electron-builder.yml uses to generate the packaged
// app's .icns/.ico - also applied here so the unpackaged dev app (npm run
// electron:dev) shows the real icon instead of Electron's default one.
const ICON_PATH = path.join(__dirname, '..', 'public', 'logo.png');

// Persistent, per-launch log of everything the app printed (main process AND
// the embedded API server, which runs in this same process - see
// createWindow() below). Packaged apps have no attached terminal, so without
// this, console.log/console.error output is simply invisible to the user -
// there was no way to see what actually went wrong after installing.
// Truncated (not appended) on every launch so it always reflects the most
// recent run.
const LOG_PATH = path.join(app.getPath('userData'), 'logs', 'main.log');
fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
const logStream = fs.createWriteStream(LOG_PATH, { flags: 'w' });
for (const level of ['log', 'info', 'warn', 'error']) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    original(...args);
    logStream.write(`[${new Date().toISOString()}] [${level}] ${args.map(String).join(' ')}\n`);
  };
}

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

// Also reveals the log file in Finder/Explorer, not just a dialog - a fatal
// error here means the window may never have opened, so this is the only way
// for the user to hand over useful detail (the on-screen message alone was
// how a startup crash silently showed as nothing more than "server error").
function reportFatalError(title, err) {
  console.error(err);
  dialog.showErrorBox(title, `${err?.stack ?? String(err)}\n\nProtokoll: ${LOG_PATH}`);
  shell.showItemInFolder(LOG_PATH);
}

process.on('uncaughtException', (err) => reportFatalError('Unerwarteter Fehler', err));
process.on('unhandledRejection', (err) => reportFatalError('Unerwarteter Fehler', err));

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
  // Plain "Electron/x.y.z" is already present in ANY Electron app's user
  // agent (including e.g. Claude's own desktop preview browser), so it can't
  // tell "our packaged app" apart from "some other Electron-based renderer".
  // This app-specific marker is what src/app/core/electron-detection.ts
  // actually checks for.
  mainWindow.webContents.setUserAgent(`${mainWindow.webContents.getUserAgent()} ReelioDesktop/1.0`);
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  mainWindow.on('closed', () => {
    mainWindow = null;
    server.close();
  });
}

// Menu.setApplicationMenu(customTemplate) REPLACES Electron's default menu
// wholesale, not merges with it - so the standard roles (Undo/Cut/Copy/Paste,
// which the URL input relies on; Toggle Developer Tools; Quit) must be
// rebuilt explicitly here, or they'd silently stop working.
const isMac = process.platform === 'darwin';
Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    { role: 'viewMenu' }, // includes the standard "Toggle Developer Tools" item/shortcut
    { role: 'windowMenu' },
    {
      label: 'Hilfe',
      submenu: [{ label: 'Fehlerprotokoll anzeigen', click: () => shell.showItemInFolder(LOG_PATH) }],
    },
  ]),
);

app.whenReady().then(() => {
  // BrowserWindow's `icon` option doesn't affect the macOS Dock tile - only
  // packaged .app bundles pick that up automatically from the .icns baked in
  // by electron-builder. Setting it explicitly here covers the unpackaged
  // dev run (npm run electron:dev) too. Requires the app to be ready.
  // Wrapped defensively: this previously threw synchronously when the
  // packaged app's asar didn't contain public/logo.png (now fixed in
  // electron-builder.yml), which crashed here BEFORE createWindow() ever
  // ran - the whole app silently failed to open a window at all.
  try {
    app.dock?.setIcon(ICON_PATH);
  } catch (err) {
    console.error('Dock-Icon konnte nicht gesetzt werden:', err);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
