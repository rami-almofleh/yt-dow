export type DesktopOs = 'mac' | 'windows' | 'linux';

// electron-builder's artifactName (see electron-builder.yml) produces these
// exact, version-less filenames, so GitHub's stable "latest" redirect always
// resolves to the current release without updating this file per version.
export const DOWNLOAD_LINKS: Record<DesktopOs, string> = {
  mac: 'https://github.com/rami-almofleh/yt-dow/releases/latest/download/amapin-mac.dmg',
  windows: 'https://github.com/rami-almofleh/yt-dow/releases/latest/download/amapin-win.exe',
  linux: 'https://github.com/rami-almofleh/yt-dow/releases/latest/download/amapin-linux.AppImage',
};
