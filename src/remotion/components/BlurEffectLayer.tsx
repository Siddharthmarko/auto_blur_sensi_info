import React from 'react';
import { useCurrentFrame } from 'remotion';
import { BlurEffect } from '../../types/project';

interface BlurEffectLayerProps {
  effect: BlurEffect;
  videoWidth: number;
  videoHeight: number;
}

export const BlurEffectLayer: React.FC<BlurEffectLayerProps> = ({
  effect,
}) => {
  const frame = useCurrentFrame();

  // If the current frame is outside the blur effect's active time range or hidden, do not render
  if (frame < effect.startFrame || frame > effect.endFrame || effect.visible === false) {
    return null;
  }

  const isEllipse = effect.shape === 'ellipse';
  const borderRadius = isEllipse ? '50%' : `${effect.borderRadius ?? 0}px`;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${effect.x}px`,
        top: `${effect.y}px`,
        width: `${effect.width}px`,
        height: `${effect.height}px`,
        backdropFilter: `blur(${effect.blurAmount}px)`,
        WebkitBackdropFilter: `blur(${effect.blurAmount}px)`,
        borderRadius,
        overflow: 'hidden',
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
};
