export interface VideoDimensions {
  width: number;
  height: number;
}

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface RenderedVideoRect {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * Calculates the exact rendered dimensions and letterbox/pillarbox offset
 * of a video inside a container with `object-fit: contain`.
 */
export function getRenderedVideoRect(
  video: VideoDimensions,
  container: ContainerDimensions
): RenderedVideoRect {
  if (!video.width || !video.height || !container.width || !container.height) {
    return { offsetX: 0, offsetY: 0, width: container.width || 1, height: container.height || 1, scale: 1 };
  }

  const videoAspect = video.width / video.height;
  const containerAspect = container.width / container.height;

  let renderedWidth: number;
  let renderedHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (containerAspect > videoAspect) {
    // Pillarboxed: vertical fits exactly, black bars on left/right
    renderedHeight = container.height;
    renderedWidth = container.height * videoAspect;
    offsetX = (container.width - renderedWidth) / 2;
    offsetY = 0;
  } else {
    // Letterboxed: horizontal fits exactly, black bars on top/bottom
    renderedWidth = container.width;
    renderedHeight = container.width / videoAspect;
    offsetX = 0;
    offsetY = (container.height - renderedHeight) / 2;
  }

  const scale = renderedWidth / video.width;

  return {
    offsetX,
    offsetY,
    width: renderedWidth,
    height: renderedHeight,
    scale,
  };
}

/**
 * Converts a point on the preview container screen space (pixels)
 * into native video-space coordinates (pixels).
 */
export function screenToVideoCoords(
  screenX: number,
  screenY: number,
  video: VideoDimensions,
  container: ContainerDimensions,
  clamp = true
): { x: number; y: number } {
  const rect = getRenderedVideoRect(video, container);
  let x = (screenX - rect.offsetX) / rect.scale;
  let y = (screenY - rect.offsetY) / rect.scale;

  if (clamp) {
    x = Math.max(0, Math.min(video.width, x));
    y = Math.max(0, Math.min(video.height, y));
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

/**
 * Converts video-space coordinates and dimensions
 * into preview screen-space pixels.
 */
export function videoToScreenCoords(
  videoX: number,
  videoY: number,
  videoW: number,
  videoH: number,
  video: VideoDimensions,
  container: ContainerDimensions
): { x: number; y: number; width: number; height: number } {
  const rect = getRenderedVideoRect(video, container);

  return {
    x: rect.offsetX + videoX * rect.scale,
    y: rect.offsetY + videoY * rect.scale,
    width: videoW * rect.scale,
    height: videoH * rect.scale,
  };
}
