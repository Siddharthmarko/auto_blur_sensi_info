import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Video' },
    { key: 'V', desc: 'Select & Move Tool' },
    { key: 'B', desc: 'Blur Region Drawing Tool (Click & drag on video)' },
    { key: '← / →', desc: 'Step 1 frame backward / forward' },
    { key: 'Shift + ← / →', desc: 'Step 10 frames backward / forward' },
    { key: 'Delete / Backspace', desc: 'Delete selected blur region' },
    { key: 'Ctrl / Cmd + Z', desc: 'Undo last change' },
    { key: 'Ctrl / Cmd + Y', desc: 'Redo last change' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={18} color="#6366f1" />
            <h3 className="modal-title">Keyboard Shortcuts</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 8 }}>
          {shortcuts.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--bg-panel-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: '#a5b4fc',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
