import React, { useRef, useMemo } from 'react';
import { useProject } from '../../../state/ProjectContext';
import { frameToTimecode } from '../../utils/formatters';

interface TimeRulerProps {
  timelineWidth: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ timelineWidth }) => {
  const { project, seekTo } = useProject();
  const rulerRef = useRef<HTMLDivElement | null>(null);

  const video = project.video;
  const totalFrames = video?.durationInFrames || 300;
  const fps = video?.fps || 30;

  // Generate tick markers
  const ticks = useMemo(() => {
    if (totalFrames <= 0 || timelineWidth <= 0) return [];

    const items: Array<{ frame: number; percent: number; isMajor: boolean; label?: string }> = [];
    
    // Choose step interval based on timeline width and total frames
    const pixelsPerFrame = timelineWidth / totalFrames;
    let stepInFrames = 30; // 1 second default
    if (pixelsPerFrame < 1) stepInFrames = fps * 5; // every 5 seconds
    else if (pixelsPerFrame < 3) stepInFrames = fps * 2; // every 2 seconds
    else if (pixelsPerFrame > 15) stepInFrames = Math.max(5, Math.round(fps / 6)); // every 5 frames

    for (let frame = 0; frame <= totalFrames; frame += stepInFrames) {
      const percent = (frame / totalFrames) * 100;
      const isMajor = frame % (fps * (pixelsPerFrame < 1 ? 5 : 1)) === 0;
      items.push({
        frame,
        percent,
        isMajor,
        label: isMajor ? frameToTimecode(frame, fps) : undefined,
      });
    }

    return items;
  }, [totalFrames, timelineWidth, fps]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rulerRef.current || totalFrames <= 0) return;

    const computeFrame = (clientX: number) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const targetFrame = Math.round((clickX / rect.width) * totalFrames);
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

  return (
    <div ref={rulerRef} className="time-ruler" onPointerDown={handlePointerDown}>
      {ticks.map((tick) => (
        <React.Fragment key={tick.frame}>
          <div
            className={`ruler-tick ${tick.isMajor ? 'major' : ''}`}
            style={{ left: `${tick.percent}%` }}
          />
          {tick.label && (
            <span className="ruler-label" style={{ left: `${tick.percent}%` }}>
              {tick.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
