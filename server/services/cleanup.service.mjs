import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Deutlich länger als der Download-Timeout (siehe config.downloadTimeoutMs) -
// alles, was so alt ist, kann kein laufender Download mehr sein, sondern nur
// ein Überbleibsel eines abgestürzten/gekillten Server-Prozesses.
const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Räumt amapin-*.mp4-Temp-Dateien auf, die ein vorheriger Prozess (z. B. nach
 * einem Absturz oder harten Neustart) nicht mehr selbst löschen konnte.
 */
export async function sweepOrphanedTempFiles() {
  const dir = os.tmpdir();
  let entries;
  try {
    entries = await fs.promises.readdir(dir);
  } catch {
    return;
  }

  const now = Date.now();
  for (const entry of entries) {
    if (!entry.startsWith('amapin-') || !entry.endsWith('.mp4')) continue;

    const fullPath = path.join(dir, entry);
    try {
      const stats = await fs.promises.stat(fullPath);
      if (now - stats.mtimeMs > MAX_AGE_MS) {
        await fs.promises.unlink(fullPath);
        console.log(`Verwaiste Temp-Datei entfernt: ${fullPath}`);
      }
    } catch {
      // Datei war zwischenzeitlich schon weg oder nicht lesbar - ignorieren.
    }
  }
}
