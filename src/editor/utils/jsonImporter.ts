import { BlurEffect, JsonBlurData, JsonDetectionItem } from '../../types/project';

export interface ConvertJsonOptions {
  targetFrame?: number | 'all';
  filterText?: string;
  groupMode?: 'consolidate' | 'per-frame';
  blurAmount?: number;
}

/**
 * Fetches default blur_data.json from /Json/blur_data.json
 */
export async function fetchDefaultBlurJson(): Promise<JsonBlurData> {
  const res = await fetch('/Json/blur_data.json');
  if (!res.ok) {
    throw new Error(`Failed to load default JSON (${res.status} ${res.statusText})`);
  }
  const data: JsonBlurData = await res.json();
  return data;
}

/**
 * Parses and validates raw JSON string into JsonBlurData
 */
export function parseBlurJson(jsonString: string): JsonBlurData {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON format');
  }
  if (!Array.isArray(parsed.detections)) {
    throw new Error('Missing "detections" array in JSON');
  }
  return {
    video: {
      fps: parsed.video?.fps || 30,
      analysisFps: parsed.video?.analysisFps || parsed.video?.fps || 30,
      width: parsed.video?.width || 1920,
      height: parsed.video?.height || 1080,
      totalFrames: parsed.video?.totalFrames || 300,
    },
    detections: parsed.detections,
  };
}

/**
 * Converts JSON detection items into standard, fully editable BlurEffect objects
 */
export function convertDetectionsToBlurEffects(
  data: JsonBlurData,
  options: ConvertJsonOptions = {}
): BlurEffect[] {
  const {
    targetFrame = 'all',
    filterText = '',
    groupMode = 'consolidate',
    blurAmount = 20,
  } = options;

  const videoFps = data.video.fps || 60;
  const analysisFps = data.video.analysisFps || 30;
  const frameRatio = Math.max(1, Math.round(videoFps / analysisFps));
  const totalFrames = data.video.totalFrames || 180;

  // 1. Filter detections by frame and text
  let filtered = data.detections;

  if (targetFrame !== 'all') {
    // If targeted at a specific frame, find nearest sampled frame
    const sampleFrame = Math.floor(targetFrame / frameRatio) * frameRatio;
    filtered = filtered.filter((d) => d.frame === sampleFrame || d.frame === targetFrame);
  }

  if (filterText.trim().length > 0) {
    const query = filterText.toLowerCase().trim();
    filtered = filtered.filter((d) => d.text && d.text.toLowerCase().includes(query));
  }

  if (filtered.length === 0) {
    return [];
  }

  // 2. Strategy: Consolidate detections across frames into continuous timeline tracks
  if (groupMode === 'consolidate' && targetFrame === 'all') {
    // Group detections by text / spatial signature
    const groups = new Map<string, JsonDetectionItem[]>();

    for (const d of filtered) {
      // Key by text if present, or rounded coordinate grid
      const textKey = (d.text || '').trim();
      const groupKey = textKey.length > 0
        ? `text_${textKey.toLowerCase()}`
        : `pos_${Math.round(d.x / 50)}_${Math.round(d.y / 50)}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(d);
    }

    const effects: BlurEffect[] = [];

    groups.forEach((items) => {
      // Sort items by frame
      items.sort((a, b) => a.frame - b.frame);
      const first = items[0];
      const last = items[items.length - 1];

      const startFrame = Math.max(0, first.frame);
      const endFrame = Math.min(totalFrames - 1, last.frame + frameRatio);

      const id = `blur_json_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const name = first.text ? `JSON: ${first.text}` : `Detected Box (${first.x}, ${first.y})`;

      effects.push({
        id,
        type: 'blur',
        name,
        startFrame,
        endFrame,
        x: Math.round(first.x),
        y: Math.round(first.y),
        width: Math.round(first.width),
        height: Math.round(first.height),
        blurAmount,
        shape: 'rectangle',
        borderRadius: 0,
        visible: true,
      });
    });

    return effects;
  }

  // 3. Strategy: Exact per-frame instances
  return filtered.map((d, index) => {
    const id = `blur_json_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
    const startFrame = Math.max(0, d.frame);
    const endFrame = Math.min(totalFrames - 1, d.frame + (frameRatio > 1 ? frameRatio - 1 : 10));
    const name = d.text ? `JSON: ${d.text}` : `Detected (F${d.frame})`;

    return {
      id,
      type: 'blur',
      name,
      startFrame,
      endFrame,
      x: Math.round(d.x),
      y: Math.round(d.y),
      width: Math.round(d.width),
      height: Math.round(d.height),
      blurAmount,
      shape: 'rectangle',
      borderRadius: 0,
      visible: true,
    };
  });
}
