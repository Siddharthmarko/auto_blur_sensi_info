import React, { useRef } from 'react';
import { BlurEffect } from '../../types/project';
import {
  VideoDimensions,
  ContainerDimensions,
  videoToScreenCoords,
  getRenderedVideoRect,
} from '../utils/coordinates';

interface TransformBoxProps {
  effect: BlurEffect;
  videoDimensions: VideoDimensions;
  containerDimensions: ContainerDimensions;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BlurEffect>, recordHistory?: boolean) => void;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export const TransformBox: React.FC<TransformBoxProps> = ({
  effect,
  videoDimensions,
  containerDimensions,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const dragStartRef = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    initialEffect: BlurEffect;
  } | null>(null);

  const screenCoords = videoToScreenCoords(
    effect.x,
    effect.y,
    effect.width,
    effect.height,
    videoDimensions,
    containerDimensions
  );

  const handlePointerDown = (handle: HandleType, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();

    dragStartRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialEffect: { ...effect },
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const { handle: activeHandle, startX, startY, initialEffect } = dragStartRef.current;

      const rect = getRenderedVideoRect(videoDimensions, containerDimensions);
      const deltaXScreen = moveEvent.clientX - startX;
      const deltaYScreen = moveEvent.clientY - startY;

      const deltaX = deltaXScreen / rect.scale;
      const deltaY = deltaYScreen / rect.scale;

      let newX = initialEffect.x;
      let newY = initialEffect.y;
      let newW = initialEffect.width;
      let newH = initialEffect.height;

      const minSize = 20;

      if (activeHandle === 'move') {
        newX = Math.max(0, Math.min(videoDimensions.width - newW, initialEffect.x + deltaX));
        newY = Math.max(0, Math.min(videoDimensions.height - newH, initialEffect.y + deltaY));
      } else {
        // Horizontal adjustment
        if (activeHandle.includes('e')) {
          newW = Math.max(minSize, Math.min(videoDimensions.width - initialEffect.x, initialEffect.width + deltaX));
        } else if (activeHandle.includes('w')) {
          const possibleW = initialEffect.width - deltaX;
          if (possibleW >= minSize) {
            newX = Math.max(0, initialEffect.x + deltaX);
            newW = initialEffect.width + (initialEffect.x - newX);
          }
        }

        // Vertical adjustment
        if (activeHandle.includes('s')) {
          newH = Math.max(minSize, Math.min(videoDimensions.height - initialEffect.y, initialEffect.height + deltaY));
        } else if (activeHandle.includes('n')) {
          const possibleH = initialEffect.height - deltaY;
          if (possibleH >= minSize) {
            newY = Math.max(0, initialEffect.y + deltaY);
            newH = initialEffect.height + (initialEffect.y - newY);
          }
        }
      }

      onUpdate(
        {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        },
        false // Do not push to undo stack on each frame of dragging
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (dragStartRef.current) {
        // Record undo history on drag completion
        onUpdate({}, true);
        dragStartRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const isEllipse = effect.shape === 'ellipse';

  return (
    <div
      className={`transform-box ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${screenCoords.x}px`,
        top: `${screenCoords.y}px`,
        width: `${screenCoords.width}px`,
        height: `${screenCoords.height}px`,
        borderRadius: isEllipse ? '50%' : `${(effect.borderRadius || 0) * (screenCoords.width / effect.width)}px`,
      }}
      onPointerDown={(e) => handlePointerDown('move', e)}
    >
      {isSelected && (
        <>
          <div className="transform-box-badge">
            {effect.name} ({Math.round(effect.width)}×{Math.round(effect.height)})
          </div>

          {/* 8 Resize Handles */}
          <div className="resize-handle handle-nw" onPointerDown={(e) => handlePointerDown('nw', e)} />
          <div className="resize-handle handle-n"  onPointerDown={(e) => handlePointerDown('n', e)} />
          <div className="resize-handle handle-ne" onPointerDown={(e) => handlePointerDown('ne', e)} />
          <div className="resize-handle handle-e"  onPointerDown={(e) => handlePointerDown('e', e)} />
          <div className="resize-handle handle-se" onPointerDown={(e) => handlePointerDown('se', e)} />
          <div className="resize-handle handle-s"  onPointerDown={(e) => handlePointerDown('s', e)} />
          <div className="resize-handle handle-sw" onPointerDown={(e) => handlePointerDown('sw', e)} />
          <div className="resize-handle handle-w"  onPointerDown={(e) => handlePointerDown('w', e)} />
        </>
      )}
    </div>
  );
};
