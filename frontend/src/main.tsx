import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Apply persisted theme before first paint so we don't flash light → dark
try {
  const raw = localStorage.getItem('faro-preferences');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.darkTheme) document.documentElement.dataset.theme = 'dark';
  }
} catch {
  // ignore — defaults to light
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
