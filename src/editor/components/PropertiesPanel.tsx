import React from 'react';
import {
  Sliders,
  Layers,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Maximize2,
  AlignCenter,
  Clock,
  Plus,
  Play,
  FileCode,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext';
import { frameToTimecode, frameToSeconds } from '../utils/formatters';

interface PropertiesPanelProps {
  onOpenImportJson?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ onOpenImportJson }) => {
  const {
    project,
    selectedEffect,
    selectedEffectId,
    setSelectedEffectId,
    updateEffect,
    removeEffect,
    duplicateEffect,
    addEffect,
    currentFrame,
    seekTo,
  } = useProject();

  const video = project.video;
  const videoW = video?.width || 1920;
  const videoH = video?.height || 1080;
  const totalFrames = video?.durationInFrames || 300;
  const fps = video?.fps || 30;

  if (!video) {
    return (
      <aside className="editor-properties">
        <div className="properties-header">
          <span className="properties-title">Properties</span>
        </div>
        <div className="properties-section" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          No video loaded.
        </div>
      </aside>
    );
  }

  return (
    <aside className="editor-properties">
      {/* Header */}
      <div className="properties-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sliders size={14} color="#6366f1" />
          <span className="properties-title">
            {selectedEffect ? 'Effect Settings' : 'Video & Layers'}
          </span>
        </div>

        {selectedEffect && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => duplicateEffect(selectedEffect.id)}
              title="Duplicate Effect"
            >
              <Copy size={14} />
            </button>
            <button
              className="btn btn-danger-ghost btn-icon"
              onClick={() => removeEffect(selectedEffect.id)}
              title="Delete Effect (Del)"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {selectedEffect ? (
        <>
          {/* Effect Identity */}
          <div className="properties-section">
            <div className="section-label">Effect Identity</div>
            <div className="form-row">
              <input
                type="text"
                className="input-field"
                value={selectedEffect.name}
                onChange={(e) => updateEffect(selectedEffect.id, { name: e.target.value })}
                placeholder="Effect Name"
              />
              <button
                className="btn btn-ghost btn-icon"
                onClick={() =>
                  updateEffect(selectedEffect.id, {
                    visible: selectedEffect.visible === false ? true : false,
                  })
                }
                title={selectedEffect.visible === false ? 'Show Effect' : 'Hide Effect'}
              >
                {selectedEffect.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Blur Parameters */}
          <div className="properties-section">
            <div className="section-label">Blur Intensity</div>
            <div className="slider-container">
              <div className="slider-header">
                <span>Blur Strength</span>
                <span className="slider-value">{selectedEffect.blurAmount}px</span>
              </div>
              <input
                type="range"
                className="range-input"
                min={1}
                max={100}
                value={selectedEffect.blurAmount}
                onChange={(e) =>
                  updateEffect(selectedEffect.id, { blurAmount: Number(e.target.value) })
                }
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Shape & Style</div>
              <div className="form-grid-2">
                <button
                  className={`btn ${selectedEffect.shape !== 'ellipse' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateEffect(selectedEffect.id, { shape: 'rectangle' })}
                >
                  Rectangle
                </button>
                <button
                  className={`btn ${selectedEffect.shape === 'ellipse' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateEffect(selectedEffect.id, { shape: 'ellipse' })}
                >
                  Ellipse / Oval
                </button>
              </div>
            </div>

            {selectedEffect.shape !== 'ellipse' && (
              <div className="slider-container" style={{ marginTop: 8 }}>
                <div className="slider-header">
                  <span>Corner Radius</span>
                  <span className="slider-value">{selectedEffect.borderRadius || 0}px</span>
                </div>
                <input
                  type="range"
                  className="range-input"
                  min={0}
                  max={60}
                  value={selectedEffect.borderRadius || 0}
                  onChange={(e) =>
                    updateEffect(selectedEffect.id, { borderRadius: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>

          {/* Position & Size */}
          <div className="properties-section">
            <div className="section-label">Transform & Coordinates (Video Space)</div>
            
            <div className="form-grid-2">
              <div className="input-labeled">
                <span>X</span>
                <input
                  type="number"
                  min={0}
                  max={videoW}
                  value={selectedEffect.x}
                  onChange={(e) =>
                    updateEffect(selectedEffect.id, {
                      x: Math.max(0, Math.min(videoW - selectedEffect.width, Number(e.target.value))),
                    })
                  }
                />
              </div>
              <div className="input-labeled">
                <span>Y</span>
                <input
                  type="number"
                  min={0}
                  max={videoH}
                  value={selectedEffect.y}
                  onChange={(e) =>
                    updateEffect(selectedEffect.id, {
                      y: Math.max(0, Math.min(videoH - selectedEffect.height, Number(e.target.value))),
                    })
                  }
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="input-labeled">
                <span>W</span>
                <input
                  type="number"
                  min={20}
                  max={videoW}
                  value={selectedEffect.width}
                  onChange={(e) =>
                    updateEffect(selectedEffect.id, {
                      width: Math.max(20, Math.min(videoW - selectedEffect.x, Number(e.target.value))),
                    })
                  }
                />
              </div>
              <div className="input-labeled">
                <span>H</span>
                <input
                  type="number"
                  min={20}
                  max={videoH}
                  value={selectedEffect.height}
                  onChange={(e) =>
                    updateEffect(selectedEffect.id, {
                      height: Math.max(20, Math.min(videoH - selectedEffect.y, Number(e.target.value))),
                    })
                  }
                />
              </div>
            </div>

            {/* Quick Alignment helpers */}
            <div className="form-grid-2" style={{ marginTop: 4 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() =>
                  updateEffect(selectedEffect.id, {
                    x: Math.round((videoW - selectedEffect.width) / 2),
                    y: Math.round((videoH - selectedEffect.height) / 2),
                  })
                }
              >
                <AlignCenter size={12} />
                <span>Center Box</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() =>
                  updateEffect(selectedEffect.id, {
                    x: 0,
                    width: videoW,
                  })
                }
              >
                <Maximize2 size={12} />
                <span>Full Width</span>
              </button>
            </div>
          </div>

          {/* Time Range */}
          <div className="properties-section">
            <div className="section-label">Timing & Duration</div>
            
            <div className="form-grid-2">
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Start Frame</div>
                <div className="input-labeled">
                  <span>F</span>
                  <input
                    type="number"
                    min={0}
                    max={selectedEffect.endFrame - 1}
                    value={selectedEffect.startFrame}
                    onChange={(e) => {
                      const sf = Math.max(0, Math.min(selectedEffect.endFrame - 1, Number(e.target.value)));
                      updateEffect(selectedEffect.id, { startFrame: sf });
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {frameToTimecode(selectedEffect.startFrame, fps)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>End Frame</div>
                <div className="input-labeled">
                  <span>F</span>
                  <input
                    type="number"
                    min={selectedEffect.startFrame + 1}
                    max={totalFrames - 1}
                    value={selectedEffect.endFrame}
                    onChange={(e) => {
                      const ef = Math.min(totalFrames - 1, Math.max(selectedEffect.startFrame + 1, Number(e.target.value)));
                      updateEffect(selectedEffect.id, { endFrame: ef });
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {frameToTimecode(selectedEffect.endFrame, fps)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 11, padding: '4px 6px' }}
                onClick={() => {
                  const sf = Math.min(currentFrame, selectedEffect.endFrame - 1);
                  updateEffect(selectedEffect.id, { startFrame: sf });
                }}
                title="Set Start Frame to Current Playhead"
              >
                <Clock size={12} />
                <span>Start @ Playhead</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 11, padding: '4px 6px' }}
                onClick={() => {
                  const ef = Math.max(currentFrame, selectedEffect.startFrame + 1);
                  updateEffect(selectedEffect.id, { endFrame: ef });
                }}
                title="Set End Frame to Current Playhead"
              >
                <Clock size={12} />
                <span>End @ Playhead</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              <span>Duration:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {selectedEffect.endFrame - selectedEffect.startFrame + 1} frames ({frameToSeconds(selectedEffect.endFrame - selectedEffect.startFrame + 1, fps)})
              </span>
            </div>
          </div>
        </>
      ) : null}

      {/* Layer Stack / Multi-Effect Manager */}
      <div className="properties-section" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={13} />
            <span>Blur Layers ({project.effects.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {onOpenImportJson && (
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '2px 6px', color: '#38bdf8' }}
                onClick={onOpenImportJson}
                title="Import detection boxes from JSON"
              >
                <FileCode size={12} />
                <span>JSON</span>
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => addEffect()}
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {project.effects.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              No blur regions created yet.<br />Use Blur tool (B) to draw over the video.
            </div>
          ) : (
            project.effects.map((effect) => {
              const isActiveNow = currentFrame >= effect.startFrame && currentFrame <= effect.endFrame;
              const isSelected = effect.id === selectedEffectId;

              return (
                <div
                  key={effect.id}
                  className={`layer-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedEffectId(effect.id)}
                >
                  <div className="layer-name">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isActiveNow ? 'var(--accent-emerald)' : 'var(--text-dim)',
                      }}
                      title={isActiveNow ? 'Active at current frame' : 'Inactive at current frame'}
                    />
                    <span>{effect.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ width: 24, height: 24, padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo(effect.startFrame);
                      }}
                      title="Jump playhead to start of this blur"
                    >
                      <Play size={10} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ width: 24, height: 24, padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateEffect(effect.id, { visible: effect.visible === false ? true : false });
                      }}
                    >
                      {effect.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      className="btn btn-danger-ghost btn-icon"
                      style={{ width: 24, height: 24, padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEffect(effect.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
