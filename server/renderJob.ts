import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { Project, RenderJobProgress, RenderSettings } from '../src/types/project';

// Map of active/completed render jobs
const jobs = new Map<string, RenderJobProgress>();

// Cache bundled location to speed up subsequent renders
let cachedBundleLocation: string | null = null;

export function getRenderJob(jobId: string): RenderJobProgress | undefined {
  return jobs.get(jobId);
}

export function getAllRenderJobs(): RenderJobProgress[] {
  return Array.from(jobs.values());
}

export async function createRenderJob(
  project: Project,
  settings: RenderSettings,
  serverOrigin: string
): Promise<string> {
  const jobId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Ensure output directory exists
  const rendersDir = path.resolve(process.cwd(), 'public', 'renders');
  if (!fs.existsSync(rendersDir)) {
    fs.mkdirSync(rendersDir, { recursive: true });
  }

  const outputFileName = `render_${jobId}.${settings.format || 'mp4'}`;
  const outputLocation = path.join(rendersDir, outputFileName);
  const totalFrames = project.video?.durationInFrames || 300;

  const job: RenderJobProgress = {
    jobId,
    status: 'bundling',
    renderedFrames: 0,
    totalFrames,
    progressPercent: 0,
    fps: settings.fps || project.video?.fps || 30,
    outputFileName,
    outputUrl: `/renders/${outputFileName}`,
    startedAt: Date.now(),
  };

  jobs.set(jobId, job);

  // Run render in the background asynchronously
  runRenderProcess(jobId, project, settings, outputLocation, serverOrigin).catch((err) => {
    console.error(`[RenderJob ${jobId}] Error:`, err);
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : String(err);
    job.finishedAt = Date.now();
  });

  return jobId;
}

async function runRenderProcess(
  jobId: string,
  project: Project,
  settings: RenderSettings,
  outputLocation: string,
  serverOrigin: string
) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // 1. If project video src is a relative url (/uploads/...), prefix with server origin so headless browser can fetch it
    const normalizedProject: Project = {
      ...project,
      video: project.video
        ? {
            ...project.video,
            src: project.video.src.startsWith('/')
              ? `${serverOrigin}${project.video.src}`
              : project.video.src,
          }
        : null,
    };

    console.log(`[RenderJob ${jobId}] Starting bundle...`);
    job.status = 'bundling';

    // Bundle Remotion entry point (or use cached bundle)
    if (!cachedBundleLocation) {
      const entryPoint = path.resolve(process.cwd(), 'src', 'remotion', 'Root.tsx');
      cachedBundleLocation = await bundle({
        entryPoint,
        webpackOverride: (config) => config,
      });
    }

    console.log(`[RenderJob ${jobId}] Selecting composition...`);
    const composition = await selectComposition({
      serveUrl: cachedBundleLocation,
      id: 'MainComposition',
      inputProps: {
        project: normalizedProject,
      },
    });

    job.status = 'rendering';
    job.totalFrames = composition.durationInFrames;

    console.log(`[RenderJob ${jobId}] Rendering media to ${outputLocation}...`);

    await renderMedia({
      composition,
      serveUrl: cachedBundleLocation,
      codec: settings.format === 'webm' ? 'vp8' : 'h264',
      outputLocation,
      inputProps: {
        project: normalizedProject,
      },
      scale: settings.scale || 1,
      onProgress: ({ renderedFrames, progress }) => {
        job.renderedFrames = renderedFrames;
        job.progressPercent = Math.round(progress * 100);
      },
    });

    job.status = 'completed';
    job.progressPercent = 100;
    job.renderedFrames = job.totalFrames;
    job.finishedAt = Date.now();
    console.log(`[RenderJob ${jobId}] Successfully rendered: ${outputLocation}`);
  } catch (error) {
    console.error(`[RenderJob ${jobId}] Failed during rendering:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown rendering failure';
    job.finishedAt = Date.now();
  }
}
