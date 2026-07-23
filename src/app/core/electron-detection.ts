// Plain "Electron/x.y.z" would also match any other Electron-based renderer
// (e.g. Claude's own desktop preview browser) - not specific to our app.
// electron/main.mjs appends this exact marker to its BrowserWindow's user
// agent, so only our packaged desktop app matches here.
export function isElectronApp(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('ReelioDesktop/');
}
