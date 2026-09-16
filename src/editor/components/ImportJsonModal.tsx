import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileCode,
  Sparkles,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext';
import { JsonBlurData } from '../../types/project';
import {
  fetchDefaultBlurJson,
  parseBlurJson,
  convertDetectionsToBlurEffects,
} from '../utils/jsonImporter';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({ isOpen, onClose }) => {
  const { project, setVideo, currentFrame, importEffects } = useProject();

  const [jsonData, setJsonData] = useState<JsonBlurData | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [targetScope, setTargetScope] = useState<'all' | 'current'>('all');
  const [groupMode, setGroupMode] = useState<'consolidate' | 'per-frame'>('consolidate');
  const [blurAmount, setBlurAmount] = useState<number>(20);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch default JSON on initial open if not already loaded
  useEffect(() => {
    if (isOpen && !jsonData) {
      handleLoadDefaultJson();
    }
  }, [isOpen]);

  const handleLoadDefaultJson = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchDefaultBlurJson();
      setJsonData(data);
    } catch (err) {
      console.error('Failed to load default JSON:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch default JSON');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseBlurJson(text);
        setJsonData(parsed);
      } catch (err) {
        console.error('Failed to parse uploaded JSON:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Invalid detection JSON file');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Preview the converted blur effects
  const generatedEffects = useMemo(() => {
    if (!jsonData) return [];
    return convertDetectionsToBlurEffects(jsonData, {
      targetFrame: targetScope === 'current' ? currentFrame : 'all',
      filterText,
      groupMode,
      blurAmount,
    });
  }, [jsonData, targetScope, currentFrame, filterText, groupMode, blurAmount]);

  const handleApplyImport = () => {
    if (generatedEffects.length === 0) return;

    // If no video is currently loaded, initialize a composition with the JSON's video metadata
    if (!project.video && jsonData) {
      setVideo({
        src: '',
        name: 'JSON Composition',
        width: jsonData.video.width || 1920,
        height: jsonData.video.height || 1080,
        durationInFrames: jsonData.video.totalFrames || 180,
        fps: jsonData.video.fps || 60,
        durationInSeconds: (jsonData.video.totalFrames || 180) / (jsonData.video.fps || 60),
      });
    }

    // Import into the project's standard effects array
    importEffects(generatedEffects, replaceExisting);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCode size={18} color="#06b6d4" />
            <h3 className="modal-title">Import JSON Detections into Editable Blurs</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', gap: 14 }}>
          {/* JSON Source selection buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleLoadDefaultJson}
              disabled={isLoading}
            >
              <Sparkles size={14} />
              <span>Load blur_data.json</span>
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload size={14} />
              <span>Upload Custom JSON</span>
            </button>
          </div>

          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 10,
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-rose)',
                fontSize: 12,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {jsonData && (
            <>
              {/* Metadata Info Card */}
              <div
                style={{
                  background: 'var(--bg-panel-secondary)',
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  fontSize: 11,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Resolution: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {jsonData.video.width}×{jsonData.video.height}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>FPS: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {jsonData.video.fps} FPS
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total Frames: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {jsonData.video.totalFrames} F
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total Detections: </span>
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                    {jsonData.detections.length.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Filtering Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Search Text Filter */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Filter by Detected Text (or leave blank for all)
                  </div>
                  <div className="input-labeled">
                    <span><Search size={12} /></span>
                    <input
                      type="text"
                      placeholder="e.g. 'OCR', 'Requirement', 'Untitled document', 'Passcode'..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                  </div>
                </div>

                {/* Scope: All Frames vs Current Frame */}
                <div className="form-row">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Target Scope</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`btn ${targetScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setTargetScope('all')}
                    >
                      All Frames
                    </button>
                    <button
                      className={`btn ${targetScope === 'current' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setTargetScope('current')}
                    >
                      Current Frame ({currentFrame})
                    </button>
                  </div>
                </div>

                {/* Track Grouping Mode */}
                {targetScope === 'all' && (
                  <div className="form-row">
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Track Grouping</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`btn ${groupMode === 'consolidate' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setGroupMode('consolidate')}
                        title="Merges detections over time into continuous editable blur tracks"
                      >
                        Consolidated Tracks
                      </button>
                      <button
                        className={`btn ${groupMode === 'per-frame' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setGroupMode('per-frame')}
                        title="Creates individual blur boxes for each frame detection"
                      >
                        Individual Frame Boxes
                      </button>
                    </div>
                  </div>
                )}

                {/* Initial Blur Strength */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span>Initial Blur Strength</span>
                    <span className="slider-value">{blurAmount}px</span>
                  </div>
                  <input
                    type="range"
                    className="range-input"
                    min={1}
                    max={80}
                    value={blurAmount}
                    onChange={(e) => setBlurAmount(Number(e.target.value))}
                  />
                </div>

                {/* Replace vs Append */}
                <div className="form-row">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Import Mode</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`btn ${!replaceExisting ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setReplaceExisting(false)}
                    >
                      Append to Existing ({project.effects.length})
                    </button>
                    <button
                      className={`btn ${replaceExisting ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setReplaceExisting(true)}
                    >
                      Replace Existing
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview List of Generated Blur Objects */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#38bdf8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} />
                    <span>Editable Blur Boxes to Create:</span>
                  </div>
                  <span>{generatedEffects.length} blur regions</span>
                </div>

                <div
                  style={{
                    maxHeight: 160,
                    overflowY: 'auto',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {generatedEffects.length === 0 ? (
                    <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-dim)' }}>
                      No matching detections found with current filter
                    </div>
                  ) : (
                    generatedEffects.slice(0, 30).map((eff) => (
                      <div
                        key={eff.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        <span style={{ fontWeight: 500, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                          {eff.name}
                        </span>
                        <div style={{ display: 'flex', gap: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          <span>F{eff.startFrame}–{eff.endFrame}</span>
                          <span>{eff.x},{eff.y} ({eff.width}×{eff.height})</span>
                        </div>
                      </div>
                    ))
                  )}
                  {generatedEffects.length > 30 && (
                    <div style={{ textAlign: 'center', padding: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                      + {generatedEffects.length - 30} more blur objects
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn btn-primary"
            onClick={handleApplyImport}
            disabled={generatedEffects.length === 0}
          >
            <CheckCircle2 size={14} />
            <span>
              Import {generatedEffects.length} Blur {generatedEffects.length === 1 ? 'Box' : 'Boxes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
