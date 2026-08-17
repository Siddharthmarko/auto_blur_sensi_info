import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectProvider } from './state/ProjectContext';
import { EditorApp } from './editor/EditorApp';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ProjectProvider>
      <EditorApp />
    </ProjectProvider>
  </React.StrictMode>
);
