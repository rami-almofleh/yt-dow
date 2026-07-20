export function formatDuration(totalSeconds: number | null): string | null {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) {
    return null;
  }
  const seconds = Math.floor(totalSeconds % 60);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];

// Größen sind grundsätzlich Schätzungen (yt-dlps filesize_approx, geschätzte
// Ausgabe-Bitrate für die Audio-Konvertierung) - deshalb immer mit "≈" statt
// einer scheinbar exakten Zahl anzeigen.
export function formatFileSize(bytes: number | null): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const precision = unitIndex === 0 || value >= 100 ? 0 : 1;
  return `≈ ${value.toFixed(precision)} ${SIZE_UNITS[unitIndex]}`;
}
