import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRenderJob, getRenderJob, getAllRenderJobs } from './renderJob';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure public/uploads and public/renders directories exist
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
const rendersDir = path.resolve(process.cwd(), 'public', 'renders');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(rendersDir)) {
  fs.mkdirSync(rendersDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving with range request support (essential for video scrubbing)
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
  },
}));

app.use('/renders', express.static(rendersDir, {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', 'inline');
  },
}));

// Multer storage for uploaded videos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Upload video endpoint
app.post('/api/upload', upload.single('video'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    name: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// 3. Render video endpoint
app.post('/api/render', async (req: Request, res: Response): Promise<void> => {
  try {
    const { project, settings } = req.body;

    if (!project || !project.video || !project.video.src) {
      res.status(400).json({ error: 'Invalid project: No video asset found' });
      return;
    }

    const protocol = req.protocol;
    const host = req.get('host') || `localhost:${PORT}`;
    const serverOrigin = `${protocol}://${host}`;

    const jobId = await createRenderJob(
      project,
      settings || { format: 'mp4', quality: 'high', scale: 1, fps: project.video.fps || 30 },
      serverOrigin
    );

    res.json({
      success: true,
      jobId,
      message: 'Rendering process initiated',
    });
  } catch (error) {
    console.error('Failed to create render job:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal rendering error',
    });
  }
});

// 4. Check render job progress
app.get('/api/render/progress/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = getRenderJob(jobId);

  if (!job) {
    res.status(404).json({ error: `Render job ${jobId} not found` });
    return;
  }

  res.json({ job });
});

// 5. List all render jobs
app.get('/api/render/jobs', (_req: Request, res: Response) => {
  res.json({ jobs: getAllRenderJobs() });
});

app.listen(PORT, () => {
  console.log(`⚡ Remotion Blur Editor Backend Server listening on http://localhost:${PORT}`);
});
