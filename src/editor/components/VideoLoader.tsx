import React, { useState, useRef } from 'react';
import { UploadCloud, Film, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useProject } from '../../state/ProjectContext';
import { VideoAsset } from '../../types/project';
import { generateDemoVideo } from '../utils/sampleVideos';

interface VideoLoaderProps {
  onLoaded?: () => void;
}

export const VideoLoader: React.FC<VideoLoaderProps> = ({ onLoaded }) => {
  const { setVideo } = useProject();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processVideoFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Upload video file to server for persistence and Remotion headless renderer support
      let videoSrc = URL.createObjectURL(file);

      try {
        const formData = new FormData();
        formData.append('video', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            videoSrc = uploadData.url;
          }
        }
      } catch (uploadErr) {
        console.warn('Backend upload skipped (will use local blob URL):', uploadErr);
      }

      // 2. Read video metadata from DOM video element
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        tempVideo.onloadedmetadata = () => resolve();
        tempVideo.onerror = () => reject(new Error('Failed to load video metadata'));
      });

      const width = tempVideo.videoWidth || 1920;
      const height = tempVideo.videoHeight || 1080;
      const durationSeconds = tempVideo.duration || 10;
      const fps = 30; // standard default video FPS
      const durationInFrames = Math.max(1, Math.round(durationSeconds * fps));

      const asset: VideoAsset = {
        src: videoSrc,
        name: file.name,
        width,
        height,
        durationInFrames,
        fps,
        durationInSeconds: durationSeconds,
        fileSize: file.size,
      };

      setVideo(asset);
      if (onLoaded) onLoaded();
    } catch (err) {
      console.error('Error loading video file:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse video file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      processVideoFile(file);
    } else {
      setErrorMessage('Please drop a valid video file (.mp4, .webm, .mov).');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleLoadDemo = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { file, asset } = await generateDemoVideo(6, 30, 1280, 720);
      
      // Upload demo file to server
      try {
        const formData = new FormData();
        formData.append('video', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            asset.src = data.url;
          }
        }
      } catch (e) {
        console.warn('Demo upload to server fallback to local blob:', e);
      }

      setVideo(asset);
      if (onLoaded) onLoaded();
    } catch (err) {
      console.error('Failed to generate demo footage:', err);
      setErrorMessage('Failed to generate demo footage.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="editor-stage">
      <div
        className={`dropzone-container ${isDragging ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 className="animate-spin" size={40} color="#6366f1" />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Processing Video Asset...
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Extracting frames, resolution, and metadata
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <UploadCloud size={32} color="#6366f1" />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Select or Drop Video File
            </h3>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 360 }}>
              Drag and drop an MP4, WebM, or MOV video here, or click to browse local files.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Film size={15} />
                <span>Browse Files</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadDemo();
                }}
              >
                <Sparkles size={15} color="#818cf8" />
                <span>Try Demo Video</span>
              </button>
            </div>
          </>
        )}

        {errorMessage && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--accent-rose)',
              fontSize: 13,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
