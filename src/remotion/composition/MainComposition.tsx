import React from 'react';
import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { Project } from '../../types/project';
import { BlurEffectLayer } from '../components/BlurEffectLayer';

export interface MainCompositionProps {
  project: Project;
}

export const MainComposition: React.FC<MainCompositionProps> = ({ project }) => {
  const { video, effects } = project;

  if (!video || !video.src) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0a0c10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: 24,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span>No video loaded</span>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Video Track */}
      <OffthreadVideo
        src={video.src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Blur Effects Layer Stack */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {effects.map((effect) => (
          <BlurEffectLayer
            key={effect.id}
            effect={effect}
            videoWidth={video.width}
            videoHeight={video.height}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
