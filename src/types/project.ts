export interface VideoAsset {
  src: string;
  name: string;
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
  durationInSeconds: number;
  fileSize?: number;
}

export interface BlurEffect {
  id: string;
  type: 'blur';
  name: string;
  startFrame: number;
  endFrame: number;
  x: number; // Video space coordinates (pixels)
  y: number;
  width: number;
  height: number;
  blurAmount: number; // in pixels (e.g. 10 - 50)
  shape?: 'rectangle' | 'ellipse';
  borderRadius?: number;
  feather?: number;
  visible?: boolean;
}

export interface Project {
  video: VideoAsset | null;
  effects: BlurEffect[];
}

export type EditorTool = 'select' | 'blur';

export interface RenderJobProgress {
  jobId: string;
  status: 'idle' | 'bundling' | 'rendering' | 'completed' | 'failed';
  renderedFrames: number;
  totalFrames: number;
  progressPercent: number;
  fps?: number;
  outputUrl?: string;
  outputFileName?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface RenderSettings {
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
  scale: number; // 1 = 100%, 0.75, 0.5
  fps: number;
}

export interface JsonDetectionItem {
  frame: number;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface JsonBlurData {
  video: {
    fps: number;
    analysisFps?: number;
    width: number;
    height: number;
    totalFrames: number;
  };
  detections: JsonDetectionItem[];
}
