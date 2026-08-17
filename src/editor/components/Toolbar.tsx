import React from 'react';
import { MousePointer, EyeOff, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useProject } from '../../state/ProjectContext';

interface ToolbarProps {
  onOpenShortcuts: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenShortcuts }) => {
  const {
    activeTool,
    setActiveTool,
    addEffect,
    project,
    setVideo,
  } = useProject();

  const handleClearAll = () => {
    if (project.effects.length === 0) return;
    if (window.confirm('Remove all blur effects from this video?')) {
      project.effects.forEach(() => {});
      // update project with empty effects
      if (project.video) {
        setVideo({ ...project.video });
      }
    }
  };

  return (
    <aside className="editor-toolbar">
      {/* Select Tool */}
      <button
        className={`tool-button ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setActiveTool('select')}
        title="Select & Move Tool (V)"
      >
        <MousePointer size={18} />
        <span className="tool-shortcut-badge">V</span>
      </button>

      {/* Blur Tool */}
      <button
        className={`tool-button ${activeTool === 'blur' ? 'active' : ''}`}
        onClick={() => setActiveTool('blur')}
        title="Blur Region Drawing Tool (B) - Click & drag on video preview"
      >
        <EyeOff size={18} />
        <span className="tool-shortcut-badge">B</span>
      </button>

      <div className="toolbar-divider" />

      {/* Quick Add Blur Region */}
      <button
        className="tool-button"
        onClick={() => addEffect()}
        disabled={!project.video}
        title="Add Default Blur Region at Playhead"
      >
        <Plus size={18} />
      </button>

      {/* Clear all blur effects */}
      {project.effects.length > 0 && (
        <button
          className="tool-button"
          onClick={handleClearAll}
          title="Remove all blur effects"
        >
          <Trash2 size={16} color="var(--text-dim)" />
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Keyboard Shortcuts Trigger */}
      <button
        className="tool-button"
        onClick={onOpenShortcuts}
        title="Shortcuts & Tips"
      >
        <HelpCircle size={18} />
      </button>
    </aside>
  );
};
