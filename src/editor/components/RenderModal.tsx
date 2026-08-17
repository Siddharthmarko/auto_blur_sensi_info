import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext';
import { RenderJobProgress, RenderSettings } from '../../types/project';
import { frameToSeconds } from '../utils/formatters';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({ isOpen, onClose }) => {
  const { project } = useProject();

  const [settings, setSettings] = useState<RenderSettings>({
    format: 'mp4',
    quality: 'high',
    scale: 1,
    fps: project.video?.fps || 30,
  });

  const [jobProgress, setJobProgress] = useState<RenderJobProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const video = project.video;

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen || !video) return null;

  const handleStartRender = async () => {
    setIsSubmitting(true);
    setRenderError(null);

    try {
      // 1. If video.src is a blob URL from client, upload the file first if not already on server
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          settings,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to start rendering');
      }

      const data = await res.json();
      const jobId = data.jobId;

      setJobProgress({
        jobId,
        status: 'bundling',
        renderedFrames: 0,
        totalFrames: video.durationInFrames,
        progressPercent: 0,
        startedAt: Date.now(),
      });

      // Poll progress every 500ms
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/render/progress/${jobId}`);
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            const job: RenderJobProgress = pollData.job;
            setJobProgress(job);

            if (job.status === 'completed' || job.status === 'failed') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              if (job.status === 'failed') {
                setRenderError(job.error || 'Rendering encountered an error');
              }
            }
          }
        } catch (pollErr) {
          console.error('Polling render status error:', pollErr);
        }
      }, 500);
    } catch (err) {
      console.error('Render start error:', err);
      setRenderError(err instanceof Error ? err.message : 'Failed to initiate render');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!jobProgress?.outputUrl) return;
    const a = document.createElement('a');
    a.href = jobProgress.outputUrl;
    a.download = jobProgress.outputFileName || 'rendered_blurred_video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isRendering = jobProgress?.status === 'bundling' || jobProgress?.status === 'rendering';
  const isCompleted = jobProgress?.status === 'completed';

  return (
    <div className="modal-backdrop" onClick={!isRendering ? onClose : undefined}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Film size={18} color="#6366f1" />
            <h3 className="modal-title">Render Video with Remotion</h3>
          </div>
          {!isRendering && (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {!jobProgress ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Your project will be composited and encoded into a high quality video using the Remotion rendering engine.
              </div>

              {/* Specs Summary */}
              <div
                style={{
                  background: 'var(--bg-panel-secondary)',
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Resolution: </span>
                  <span style={{ fontWeight: 600 }}>{Math.round(video.width * settings.scale)}×{Math.round(video.height * settings.scale)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Framerate: </span>
                  <span style={{ fontWeight: 600 }}>{settings.fps} FPS</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                  <span style={{ fontWeight: 600 }}>{frameToSeconds(video.durationInFrames, video.fps)} ({video.durationInFrames} frames)</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Blur Layers: </span>
                  <span style={{ fontWeight: 600 }}>{project.effects.length} active</span>
                </div>
              </div>

              {/* Render Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="form-row">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Format</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`btn ${settings.format === 'mp4' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => setSettings({ ...settings, format: 'mp4' })}
                    >
                      MP4 (H.264)
                    </button>
                    <button
                      className={`btn ${settings.format === 'webm' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => setSettings({ ...settings, format: 'webm' })}
                    >
                      WebM (VP8)
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Output Scale</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`btn ${settings.scale === 1 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setSettings({ ...settings, scale: 1 })}
                    >
                      100% (Native)
                    </button>
                    <button
                      className={`btn ${settings.scale === 0.75 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setSettings({ ...settings, scale: 0.75 })}
                    >
                      75%
                    </button>
                    <button
                      className={`btn ${settings.scale === 0.5 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setSettings({ ...settings, scale: 0.5 })}
                    >
                      50% (Fast)
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Progress state */}
              {isRendering && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Loader2 className="animate-spin" size={18} color="#6366f1" />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {jobProgress.status === 'bundling'
                          ? 'Bundling Remotion Composition...'
                          : `Rendering Media (${jobProgress.progressPercent}%)`}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {jobProgress.renderedFrames} / {jobProgress.totalFrames} frames
                    </span>
                  </div>

                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${jobProgress.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completed State */}
              {isCompleted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: varRadiusMd(),
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    <CheckCircle2 size={20} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Video Rendered Successfully!</span>
                  </div>

                  {jobProgress.outputUrl && (
                    <div
                      style={{
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: '#000',
                        maxHeight: 220,
                      }}
                    >
                      <video
                        src={jobProgress.outputUrl}
                        controls
                        autoPlay
                        loop
                        style={{ width: '100%', height: '100%', maxHeight: 220, display: 'block' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Error state */}
              {renderError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--accent-rose)',
                    fontSize: 13,
                  }}
                >
                  <AlertCircle size={20} />
                  <span>{renderError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {!jobProgress ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartRender}
                disabled={isSubmitting}
              >
                <Sparkles size={14} />
                <span>{isSubmitting ? 'Starting...' : 'Start Rendering'}</span>
              </button>
            </>
          ) : isCompleted ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setJobProgress(null)}
              >
                Render Again
              </button>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={14} />
                <span>Download Video (MP4)</span>
              </button>
            </>
          ) : isRendering ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Please keep this tab open while rendering completes...
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => setJobProgress(null)}>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function varRadiusMd(): string {
  return '8px';
}
