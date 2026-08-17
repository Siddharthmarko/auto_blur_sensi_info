import React, { useState } from 'react';
import {
  Film,
  Undo2,
  Redo2,
  Sparkles,
  Download,
  FolderOpen,
  HelpCircle,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext';
import { frameToSeconds, formatFileSize } from '../utils/formatters';
import { generateDemoVideo } from '../utils/sampleVideos';

interface HeaderProps {
  onOpenRenderModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenFilePicker: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRenderModal,
  onOpenShortcutsModal,
  onOpenFilePicker,
}) => {
  const { project, canUndo, canRedo, undo, redo, setVideo } = useProject();
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const handleGenerateDemo = async () => {
    try {
      setIsGeneratingDemo(true);
      const { asset } = await generateDemoVideo(6, 30, 1280, 720);
      setVideo(asset);
    } catch (err) {
      console.error('Failed to generate demo video:', err);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const video = project.video;

  return (
    <header className="editor-header">
      {/* Brand & Video Info */}
      <div className="brand-section">
        <div className="brand-logo">
          <Film size={18} />
        </div>
        <div className="brand-title">
          <span>Remotion Blur Studio</span>
          <span className="brand-badge">V1</span>
        </div>

        {video && (
          <div className="video-specs-pill" title={video.name}>
            <div className="video-specs-dot" />
            <span>{video.width}×{video.height}</span>
            <span>•</span>
            <span>{video.fps} FPS</span>
            <span>•</span>
            <span>{frameToSeconds(video.durationInFrames, video.fps)}</span>
            {video.fileSize && (
              <>
                <span>•</span>
                <span>{formatFileSize(video.fileSize)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center / Action Buttons */}
      <div className="header-actions">
        <button
          className="btn btn-secondary btn-icon"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="btn btn-secondary btn-icon"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        <button
          className="btn btn-secondary"
          onClick={handleGenerateDemo}
          disabled={isGeneratingDemo}
          title="Load animated sample footage with confidential cards and faces"
        >
          <Sparkles size={14} color="#818cf8" />
          <span>{isGeneratingDemo ? 'Generating...' : 'Demo Footage'}</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenFilePicker}
          title="Choose a video from your computer"
        >
          <FolderOpen size={14} />
          <span>{video ? 'Change Video' : 'Open Video'}</span>
        </button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={onOpenShortcutsModal}
          title="Keyboard Shortcuts"
        >
          <HelpCircle size={16} />
        </button>

        <button
          className="btn btn-primary"
          onClick={onOpenRenderModal}
          disabled={!video}
          title="Export final composited video with Remotion renderer"
        >
          <Download size={14} />
          <span>Render Video</span>
        </button>
      </div>
    </header>
  );
};
