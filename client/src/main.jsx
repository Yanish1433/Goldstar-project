import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/mukta/latin-600.css';
import '@fontsource/mukta/devanagari-600.css';
import App from './App.jsx';
import { installStaleBuildReload } from './lib/staleBuild.js';
import { forgetStaleLoadScroll } from './lib/freshLoadScroll.js';

installStaleBuildReload();
forgetStaleLoadScroll(); // before <ScrollRestoration/> reads the saved positions

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
