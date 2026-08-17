/**
 * Converts a frame number to a standard timecode (HH:MM:SS:FF or MM:SS:FF)
 */
export function frameToTimecode(frame: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const safeFrame = Math.max(0, Math.floor(frame));

  const totalSeconds = Math.floor(safeFrame / safeFps);
  const remainingFrames = safeFrame % safeFps;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(remainingMinutes)}:${pad(seconds)}:${pad(remainingFrames)}`;
  }
  return `${pad(remainingMinutes)}:${pad(seconds)}:${pad(remainingFrames)}`;
}

/**
 * Converts a frame number to seconds string (e.g. "4.2s")
 */
export function frameToSeconds(frame: number, fps: number): string {
  const seconds = frame / Math.max(1, fps);
  return `${seconds.toFixed(2)}s`;
}

/**
 * Formats file size in bytes to human-readable string (MB, KB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}
