import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { PlayerRef } from '@remotion/player';
import { Project, VideoAsset, BlurEffect, EditorTool } from '../types/project';

interface ProjectContextType {
  project: Project;
  selectedEffectId: string | null;
  selectedEffect: BlurEffect | null;
  activeTool: EditorTool;
  currentFrame: number;
  isPlaying: boolean;
  zoomLevel: number;
  canUndo: boolean;
  canRedo: boolean;
  playerRef: React.RefObject<PlayerRef | null>;
  
  // Actions
  setVideo: (video: VideoAsset | null) => void;
  addEffect: (effect?: Partial<BlurEffect>) => BlurEffect;
  updateEffect: (id: string, updates: Partial<BlurEffect>, recordHistory?: boolean) => void;
  removeEffect: (id: string) => void;
  duplicateEffect: (id: string) => void;
  setSelectedEffectId: (id: string | null) => void;
  setActiveTool: (tool: EditorTool) => void;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  seekTo: (frame: number) => void;
  togglePlay: () => void;
  undo: () => void;
  redo: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

const MAX_HISTORY = 30;

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProjectState] = useState<Project>({
    video: null,
    effects: [],
  });

  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const playerRef = useRef<PlayerRef | null>(null);

  // Undo / Redo history stacks
  const historyRef = useRef<{ past: Project[]; future: Project[] }>({
    past: [],
    future: [],
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  };

  const pushHistory = useCallback((current: Project) => {
    historyRef.current.past.push(JSON.parse(JSON.stringify(current)));
    if (historyRef.current.past.length > MAX_HISTORY) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
    updateHistoryState();
  }, []);

  const setVideo = useCallback((video: VideoAsset | null) => {
    pushHistory(project);
    setProjectState((prev) => ({
      ...prev,
      video,
      // If new video, keep frame in range
      effects: prev.effects.map((e) => ({
        ...e,
        startFrame: Math.min(e.startFrame, (video?.durationInFrames || 300) - 1),
        endFrame: Math.min(e.endFrame, (video?.durationInFrames || 300) - 1),
      })),
    }));
    setCurrentFrame(0);
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  }, [project, pushHistory]);

  const addEffect = useCallback((customEffect?: Partial<BlurEffect>): BlurEffect => {
    pushHistory(project);

    const videoW = project.video?.width || 1920;
    const videoH = project.video?.height || 1080;
    const totalFrames = project.video?.durationInFrames || 300;
    const currentFps = project.video?.fps || 30;

    // Default duration: 3 seconds or remaining frames
    const defaultDuration = Math.min(Math.round(currentFps * 3), Math.max(30, totalFrames - currentFrame));
    const startF = Math.max(0, Math.min(currentFrame, totalFrames - 10));
    const endF = Math.min(totalFrames - 1, startF + defaultDuration);

    const id = `blur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectIndex = project.effects.length + 1;

    const newEffect: BlurEffect = {
      id,
      type: 'blur',
      name: `Blur Area ${effectIndex}`,
      startFrame: startF,
      endFrame: endF,
      x: Math.round(videoW * 0.35),
      y: Math.round(videoH * 0.35),
      width: Math.round(videoW * 0.3),
      height: Math.round(videoH * 0.2),
      blurAmount: 20,
      shape: 'rectangle',
      borderRadius: 0,
      visible: true,
      ...customEffect,
    };

    setProjectState((prev) => ({
      ...prev,
      effects: [...prev.effects, newEffect],
    }));

    setSelectedEffectId(id);
    setActiveTool('select');
    return newEffect;
  }, [project, currentFrame, pushHistory]);

  const updateEffect = useCallback(
    (id: string, updates: Partial<BlurEffect>, recordHistory = true) => {
      if (recordHistory) {
        pushHistory(project);
      }

      setProjectState((prev) => ({
        ...prev,
        effects: prev.effects.map((eff) =>
          eff.id === id ? { ...eff, ...updates } : eff
        ),
      }));
    },
    [project, pushHistory]
  );

  const removeEffect = useCallback((id: string) => {
    pushHistory(project);
    setProjectState((prev) => ({
      ...prev,
      effects: prev.effects.filter((eff) => eff.id !== id),
    }));
    if (selectedEffectId === id) {
      setSelectedEffectId(null);
    }
  }, [project, selectedEffectId, pushHistory]);

  const duplicateEffect = useCallback((id: string) => {
    const target = project.effects.find((e) => e.id === id);
    if (!target) return;

    pushHistory(project);
    const newId = `blur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duplicated: BlurEffect = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Copy)`,
      x: Math.min((project.video?.width || 1920) - target.width, target.x + 30),
      y: Math.min((project.video?.height || 1080) - target.height, target.y + 30),
    };

    setProjectState((prev) => ({
      ...prev,
      effects: [...prev.effects, duplicated],
    }));
    setSelectedEffectId(newId);
  }, [project, pushHistory]);

  const seekTo = useCallback((frame: number) => {
    const totalFrames = project.video?.durationInFrames || 300;
    const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(frame)));
    setCurrentFrame(clamped);
    if (playerRef.current) {
      playerRef.current.seekTo(clamped);
    }
  }, [project.video]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [isPlaying]);

  const undo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    const previous = historyRef.current.past.pop()!;
    historyRef.current.future.push(JSON.parse(JSON.stringify(project)));
    setProjectState(previous);
    updateHistoryState();
  }, [project]);

  const redo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(JSON.parse(JSON.stringify(project)));
    setProjectState(next);
    updateHistoryState();
  }, [project]);

  // Sync keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      // V: Select tool
      else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      }
      // B: Blur tool
      else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('blur');
      }
      // Delete / Backspace: Remove selected effect
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEffectId) {
        e.preventDefault();
        removeEffect(selectedEffectId);
      }
      // Undo: Ctrl+Z or Cmd+Z
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }
      // ArrowLeft: Step back 1 frame (or 10 with Shift)
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        seekTo(currentFrame - step);
      }
      // ArrowRight: Step forward 1 frame (or 10 with Shift)
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        seekTo(currentFrame + step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, selectedEffectId, removeEffect, undo, redo, seekTo, currentFrame]);

  const selectedEffect = project.effects.find((e) => e.id === selectedEffectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        project,
        selectedEffectId,
        selectedEffect,
        activeTool,
        currentFrame,
        isPlaying,
        zoomLevel,
        canUndo,
        canRedo,
        playerRef,
        setVideo,
        addEffect,
        updateEffect,
        removeEffect,
        duplicateEffect,
        setSelectedEffectId,
        setActiveTool,
        setCurrentFrame,
        setIsPlaying,
        setZoomLevel,
        seekTo,
        togglePlay,
        undo,
        redo,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
