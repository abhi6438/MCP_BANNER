import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Fetch server-side Figma token and store in localStorage if not already set
fetch('/api/config')
  .then(r => r.json())
  .then(cfg => {
    if (cfg.figmaToken && !localStorage.getItem('figma_token')) {
      localStorage.setItem('figma_token', cfg.figmaToken);
    }
  })
  .catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
