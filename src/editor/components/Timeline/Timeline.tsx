import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  EyeOff,
  Video as VideoIcon,
} from 'lucide-react';
import { useProject } from '../../../state/ProjectContext';
import { frameToTimecode } from '../../utils/formatters';
import { TimeRuler } from './TimeRuler';

export const Timeline: React.FC = () => {
  const {
    project,
    currentFrame,
    isPlaying,
    togglePlay,
    seekTo,
    selectedEffectId,
    setSelectedEffectId,
    updateEffect,
    zoomLevel,
    setZoomLevel,
  } = useProject();

  const tracksContainerRef = useRef<HTMLDivElement | null>(null);
  const [timelineWidth, setTimelineWidth] = useState<number>(1000);

  const video = project.video;
  const totalFrames = video?.durationInFrames || 300;
  const fps = video?.fps || 30;

  // Track container width
  useEffect(() => {
    if (!tracksContainerRef.current) return;
    const updateWidth = () => {
      if (tracksContainerRef.current) {
        setTimelineWidth(tracksContainerRef.current.clientWidth * zoomLevel);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(tracksContainerRef.current);
    return () => observer.disconnect();
  }, [zoomLevel]);

  // Handle playhead scrubbing on tracks area
  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tracksContainerRef.current || totalFrames <= 0) return;

    const computeFrame = (clientX: number) => {
      if (!tracksContainerRef.current) return;
      const rect = tracksContainerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(timelineWidth, clientX - rect.left + tracksContainerRef.current.scrollLeft));
      const targetFrame = Math.round((clickX / timelineWidth) * totalFrames);
      seekTo(targetFrame);
    };

    computeFrame(e.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      computeFrame(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Dragging blur time block (shift or trim)
  const handleBlockDrag = (
    e: React.PointerEvent,
    effectId: string,
    mode: 'move' | 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedEffectId(effectId);

    const targetEffect = project.effects.find((eff) => eff.id === effectId);
    if (!targetEffect) return;

    const startX = e.clientX;
    const initialStart = targetEffect.startFrame;
    const initialEnd = targetEffect.endFrame;
    const duration = initialEnd - initialStart;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaFrames = Math.round((deltaX / timelineWidth) * totalFrames);

      if (mode === 'move') {
        let newStart = initialStart + deltaFrames;
        let newEnd = initialEnd + deltaFrames;

        if (newStart < 0) {
          newStart = 0;
          newEnd = duration;
        }
        if (newEnd >= totalFrames) {
          newEnd = totalFrames - 1;
          newStart = Math.max(0, newEnd - duration);
        }

        updateEffect(effectId, { startFrame: newStart, endFrame: newEnd }, false);
      } else if (mode === 'trim-left') {
        const newStart = Math.max(0, Math.min(initialEnd - 1, initialStart + deltaFrames));
        updateEffect(effectId, { startFrame: newStart }, false);
      } else if (mode === 'trim-right') {
        const newEnd = Math.min(totalFrames - 1, Math.max(initialStart + 1, initialEnd + deltaFrames));
        updateEffect(effectId, { endFrame: newEnd }, false);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      // Final commit to undo history
      updateEffect(effectId, {}, true);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const playheadPercent = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  return (
    <footer className="editor-timeline">
      {/* Transport Header */}
      <div className="timeline-transport">
        {/* Playback Controls */}
        <div className="transport-controls">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => seekTo(0)}
            title="Jump to Start (Home)"
          >
            <SkipBack size={15} />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => seekTo(currentFrame - 1)}
            title="Step Back 1 Frame (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            className="btn btn-primary btn-icon"
            onClick={togglePlay}
            style={{ width: 34, height: 34 }}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => seekTo(currentFrame + 1)}
            title="Step Forward 1 Frame (Right Arrow)"
          >
            <ChevronRight size={16} />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => seekTo(totalFrames - 1)}
            title="Jump to End (End)"
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Timecode & Frame Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="timecode-display">
            <span>{frameToTimecode(currentFrame, fps)}</span>
            <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{frameToTimecode(totalFrames, fps)}</span>
          </div>

          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-input)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{currentFrame}</span>
            <span style={{ color: 'var(--text-dim)' }}> / {totalFrames} F</span>
          </div>
        </div>

        {/* Timeline Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
            disabled={zoomLevel <= 1}
            title="Zoom Out Timeline"
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            {zoomLevel.toFixed(1)}x
          </span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))}
            disabled={zoomLevel >= 4}
            title="Zoom In Timeline"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Tracks Area */}
      <div className="timeline-tracks-wrapper">
        {/* Track Headers Column */}
        <div className="timeline-headers-col">
          <div className="track-header-ruler">Tracks</div>
          
          <div className="track-header">
            <VideoIcon size={14} color="#38bdf8" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Video Track
            </span>
          </div>

          {project.effects.map((effect, idx) => (
            <div
              key={effect.id}
              className="track-header"
              style={{
                background: effect.id === selectedEffectId ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedEffectId(effect.id)}
            >
              <EyeOff size={14} color="#818cf8" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {effect.name || `Blur ${idx + 1}`}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Tracks Canvas */}
        <div
          ref={tracksContainerRef}
          className="timeline-canvas-container"
          style={{ width: `${timelineWidth}px` }}
        >
          {/* Time Ruler */}
          <TimeRuler timelineWidth={timelineWidth} />

          {/* Video Track Bar */}
          <div className="track-row" onPointerDown={handleTimelinePointerDown}>
            <div className="video-track-bar">
              <span style={{ fontWeight: 600 }}>{video?.name || 'No Video'}</span>
            </div>
          </div>

          {/* Blur Effects Track Bars */}
          {project.effects.map((effect) => {
            const leftPercent = (effect.startFrame / totalFrames) * 100;
            const widthPercent = ((effect.endFrame - effect.startFrame + 1) / totalFrames) * 100;
            const isSelected = effect.id === selectedEffectId;

            return (
              <div
                key={effect.id}
                className="track-row"
                onPointerDown={handleTimelinePointerDown}
              >
                <div
                  className={`blur-track-block ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  onPointerDown={(e) => handleBlockDrag(e, effect.id, 'move')}
                >
                  {/* Left Trim Handle */}
                  <div
                    className="trim-handle trim-handle-left"
                    onPointerDown={(e) => handleBlockDrag(e, effect.id, 'trim-left')}
                    title="Drag to trim start frame"
                  />

                  {/* Block Label */}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>
                    {effect.name} ({effect.blurAmount}px)
                  </span>

                  {/* Right Trim Handle */}
                  <div
                    className="trim-handle trim-handle-right"
                    onPointerDown={(e) => handleBlockDrag(e, effect.id, 'trim-right')}
                    title="Drag to trim end frame"
                  />
                </div>
              </div>
            );
          })}

          {/* Playhead Needle Line & Handle */}
          <div
            className="playhead-needle"
            style={{ left: `${playheadPercent}%` }}
          >
            <div
              className="playhead-handle"
              onPointerDown={handleTimelinePointerDown}
              title={`Playhead: Frame ${currentFrame}`}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
