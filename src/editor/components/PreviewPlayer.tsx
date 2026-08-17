import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Player } from '@remotion/player';
import { useProject } from '../../state/ProjectContext';
import { MainComposition } from '../../remotion/composition/MainComposition';
import { InteractiveOverlay } from './InteractiveOverlay';

export const PreviewPlayer: React.FC = () => {
  const {
    project,
    playerRef,
    setCurrentFrame,
    setIsPlaying,
  } = useProject();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerDims, setContainerDims] = useState<{ width: number; height: number }>({
    width: 800,
    height: 450,
  });

  const video = project.video;

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDims = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerDims({
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    };

    updateDims();
    const observer = new ResizeObserver(updateDims);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [video]);

  // Hook player listeners for frame update & play state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    player.addEventListener('frameupdate', onFrameUpdate);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onEnded);

    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onEnded);
    };
  }, [playerRef, setCurrentFrame, setIsPlaying, video]);

  const compositionWidth = video?.width || 1920;
  const compositionHeight = video?.height || 1080;
  const durationInFrames = video?.durationInFrames || 300;
  const fps = video?.fps || 30;

  // Memoize inputProps so Remotion Player doesn't recreate everything on unrelated re-renders
  const inputProps = useMemo(() => ({ project }), [project]);

  if (!video) return null;

  return (
    <div className="editor-stage">
      <div
        ref={containerRef}
        className="player-wrapper"
        style={{
          aspectRatio: `${compositionWidth} / ${compositionHeight}`,
          width: '100%',
          maxHeight: 'calc(100vh - var(--header-height) - var(--timeline-height) - 48px)',
        }}
      >
        <Player<any, any>
          ref={playerRef as any}
          component={MainComposition as any}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={compositionWidth}
          compositionHeight={compositionHeight}
          fps={fps}
          style={{
            width: '100%',
            height: '100%',
          }}
          controls={false}
          loop
          autoPlay={false}
        />

        {/* Interactive Overlay Layer */}
        <InteractiveOverlay
          videoDimensions={{ width: compositionWidth, height: compositionHeight }}
          containerDimensions={containerDims}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
};
