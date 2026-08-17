import React, { useState } from 'react';
import { useProject } from '../../state/ProjectContext';
import {
  VideoDimensions,
  ContainerDimensions,
  screenToVideoCoords,
} from '../utils/coordinates';
import { TransformBox } from './TransformBox';

interface InteractiveOverlayProps {
  videoDimensions: VideoDimensions;
  containerDimensions: ContainerDimensions;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  videoDimensions,
  containerDimensions,
  containerRef,
}) => {
  const {
    project,
    selectedEffectId,
    setSelectedEffectId,
    activeTool,
    setActiveTool,
    addEffect,
    updateEffect,
    currentFrame,
  } = useProject();

  const [drawState, setDrawState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const isDrawing = Boolean(drawState);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    if (activeTool === 'blur') {
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      setDrawState({
        startX: screenX,
        startY: screenY,
        currentX: screenX,
        currentY: screenY,
      });

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        const curX = moveEvent.clientX - r.left;
        const curY = moveEvent.clientY - r.top;

        setDrawState((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        if (!containerRef.current) {
          setDrawState(null);
          return;
        }

        const r = containerRef.current.getBoundingClientRect();
        const finalScreenX = upEvent.clientX - r.left;
        const finalScreenY = upEvent.clientY - r.top;

        setDrawState((currentState) => {
          if (!currentState) return null;

          const minScreenX = Math.min(currentState.startX, finalScreenX);
          const minScreenY = Math.min(currentState.startY, finalScreenY);
          const maxScreenX = Math.max(currentState.startX, finalScreenX);
          const maxScreenY = Math.max(currentState.startY, finalScreenY);

          // Convert both corners to video-space coordinates
          const p1 = screenToVideoCoords(minScreenX, minScreenY, videoDimensions, containerDimensions);
          const p2 = screenToVideoCoords(maxScreenX, maxScreenY, videoDimensions, containerDimensions);

          const vidX = Math.min(p1.x, p2.x);
          const vidY = Math.min(p1.y, p2.y);
          const vidW = Math.abs(p2.x - p1.x);
          const vidH = Math.abs(p2.y - p1.y);

          // Only create if user dragged a meaningful region (> 15px)
          if (vidW > 15 && vidH > 15) {
            addEffect({
              x: vidX,
              y: vidY,
              width: vidW,
              height: vidH,
              startFrame: Math.max(0, currentFrame),
            });
            setActiveTool('select');
          }

          return null;
        });
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      // Clicked on empty area with Select tool -> deselect
      setSelectedEffectId(null);
    }
  };

  // Visible effects: effects that are active at the current frame, plus the currently selected effect
  const visibleEffects = project.effects.filter(
    (eff) => eff.id === selectedEffectId || (currentFrame >= eff.startFrame && currentFrame <= eff.endFrame)
  );

  return (
    <div
      className={`interactive-overlay ${activeTool === 'blur' ? 'overlay-crosshair' : ''}`}
      onPointerDown={handlePointerDown}
    >
      {/* Existing Blur Region Transform Boxes */}
      {visibleEffects.map((effect) => (
        <TransformBox
          key={effect.id}
          effect={effect}
          videoDimensions={videoDimensions}
          containerDimensions={containerDimensions}
          isSelected={effect.id === selectedEffectId}
          onSelect={() => setSelectedEffectId(effect.id)}
          onUpdate={(updates, recordHistory) => updateEffect(effect.id, updates, recordHistory)}
        />
      ))}

      {/* Live Drawing Bounding Box */}
      {isDrawing && drawState && (
        <div
          className="drawing-box"
          style={{
            left: `${Math.min(drawState.startX, drawState.currentX)}px`,
            top: `${Math.min(drawState.startY, drawState.currentY)}px`,
            width: `${Math.abs(drawState.currentX - drawState.startX)}px`,
            height: `${Math.abs(drawState.currentY - drawState.startY)}px`,
          }}
        />
      )}
    </div>
  );
};
