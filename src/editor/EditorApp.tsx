import React, { useState, useRef } from 'react';
import { useProject } from '../state/ProjectContext';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { VideoLoader } from './components/VideoLoader';
import { PreviewPlayer } from './components/PreviewPlayer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline/Timeline';
import { RenderModal } from './components/RenderModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ImportJsonModal } from './components/ImportJsonModal';
import { VideoAsset } from '../types/project';

export const EditorApp: React.FC = () => {
  const { project, setVideo } = useProject();
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isImportJsonOpen, setIsImportJsonOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = URL.createObjectURL(file);

    tempVideo.onloadedmetadata = async () => {
      let videoSrc = tempVideo.src;

      try {
        const formData = new FormData();
        formData.append('video', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) videoSrc = data.url;
        }
      } catch (err) {
        console.warn('Fallback to local blob URL:', err);
      }

      const width = tempVideo.videoWidth || 1920;
      const height = tempVideo.videoHeight || 1080;
      const duration = tempVideo.duration || 10;
      const fps = 30;
      const durationInFrames = Math.max(1, Math.round(duration * fps));

      const asset: VideoAsset = {
        src: videoSrc,
        name: file.name,
        width,
        height,
        durationInFrames,
        fps,
        durationInSeconds: duration,
        fileSize: file.size,
      };

      setVideo(asset);
    };
  };

  return (
    <div className="editor-layout">
      {/* Hidden file input for Header Open Video button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        style={{ display: 'none' }}
        onChange={handleManualFileSelect}
      />

      {/* Top Navigation Bar */}
      <Header
        onOpenRenderModal={() => setIsRenderModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onOpenFilePicker={() => fileInputRef.current?.click()}
        onOpenImportJsonModal={() => setIsImportJsonOpen(true)}
      />

      {/* Main Workspace */}
      <div className="editor-workspace">
        {/* Left Toolbar */}
        <Toolbar
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenImportJson={() => setIsImportJsonOpen(true)}
        />

        {/* Center Canvas / Preview Stage */}
        {project.video ? <PreviewPlayer /> : <VideoLoader />}

        {/* Right Properties Panel */}
        <PropertiesPanel onOpenImportJson={() => setIsImportJsonOpen(true)} />
      </div>

      {/* Bottom Timeline */}
      {project.video && <Timeline />}

      {/* Modals */}
      <RenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ImportJsonModal
        isOpen={isImportJsonOpen}
        onClose={() => setIsImportJsonOpen(false)}
      />
    </div>
  );
};
