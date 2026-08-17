import { VideoAsset } from '../../types/project';

/**
 * Creates a synthetic demo video using Canvas and MediaRecorder.
 * The video contains moving elements (simulated license plate, face badge, confidential text)
 * perfect for testing and demonstrating the blur effect.
 */
export async function generateDemoVideo(
  durationSeconds = 6,
  fps = 30,
  width = 1280,
  height = 720
): Promise<{ file: File; asset: VideoAsset }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Could not create canvas context'));
    }

    const stream = canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
      ? 'video/webm; codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 3000000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'demo_confidential_video.webm', {
        type: 'video/webm',
      });
      const src = URL.createObjectURL(blob);
      const totalFrames = Math.round(durationSeconds * fps);

      resolve({
        file,
        asset: {
          src,
          name: 'demo_confidential_video.webm',
          width,
          height,
          durationInFrames: totalFrames,
          fps,
          durationInSeconds: durationSeconds,
          fileSize: blob.size,
        },
      });
    };

    recorder.start();

    const totalFrames = Math.round(durationSeconds * fps);
    let currentFrame = 0;

    const interval = setInterval(() => {
      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
        return;
      }

      const t = currentFrame / fps;
      const progress = currentFrame / totalFrames;

      // Draw background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid background lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Title Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText('Remotion Blur Studio - Demo Footage', 60, 80);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px Inter, sans-serif';
      ctx.fillText(`Frame: ${currentFrame + 1} / ${totalFrames}  |  Time: ${t.toFixed(2)}s  |  Resolution: ${width}x${height}`, 60, 120);

      // Moving Item 1: Confidential ID Card
      const cardX = 100 + Math.sin(t * 1.2) * 60;
      const cardY = 200 + Math.cos(t * 0.8) * 30;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, 340, 200, 16);
      ctx.fill();
      ctx.stroke();

      // Card Header
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, 340, 48, [16, 16, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('CONFIDENTIAL IDENTITY', cardX + 20, cardY + 32);

      // Card Details
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText('NAME: Alex Mercer (VIP)', cardX + 24, cardY + 84);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('SSN: 489-01-9284', cardX + 24, cardY + 118);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('PASSCODE: #8902-KEY-SECURE', cardX + 24, cardY + 152);
      ctx.fillStyle = '#64748b';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText('Target for Blur Effect', cardX + 24, cardY + 182);

      // Moving Item 2: Simulated License Plate Vehicle
      const plateX = 540 + Math.cos(t * 1.5) * 80;
      const plateY = 240 + Math.sin(t * 1.1) * 40;
      
      // Car silhouette
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(plateX - 20, plateY - 40, 320, 180, 20);
      ctx.fill();
      ctx.stroke();

      // License plate
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(plateX + 30, plateY + 40, 220, 60, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CA • 9XYZ882', plateX + 140, plateY + 82);
      ctx.textAlign = 'left';

      // Moving Item 3: Simulated Person Face Avatar
      const faceX = 940 + Math.sin(t * 1.8) * 40;
      const faceY = 260 + Math.cos(t * 1.4) * 50;

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(faceX + 80, faceY + 80, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Face features
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(faceX + 80, faceY + 80, 65, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(faceX + 60, faceY + 70, 8, 0, Math.PI * 2);
      ctx.arc(faceX + 100, faceY + 70, 8, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(faceX + 80, faceY + 85, 30, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText('USER FACE TARGET', faceX + 15, faceY + 185);

      // Bottom animated timeline bar inside demo video
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(60, height - 60, width - 120, 12);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(60, height - 60, (width - 120) * progress, 12);

      currentFrame++;
    }, 1000 / fps);
  });
}
