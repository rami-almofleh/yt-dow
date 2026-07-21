const { execFileSync } = require('node:child_process');
const path = require('node:path');

// electron-builder's `identity: null` (see electron-builder.yml) intentionally
// skips ALL codesigning to avoid needing a paid Apple Developer certificate.
// But Apple Silicon requires *some* valid code signature to run any binary at
// all - a completely unsigned arm64 app doesn't get the usual "unidentified
// developer" warning, macOS reports it as "damaged" and refuses to open it
// outright. An ad-hoc signature (`-s -`) is free (no certificate needed) and
// fixes exactly that, without changing the app's "unsigned, unnotarized"
// status - right-click > Open still shows the normal Gatekeeper prompt.
module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath]);
  console.log(`Ad-hoc signed: ${appPath}`);
};
