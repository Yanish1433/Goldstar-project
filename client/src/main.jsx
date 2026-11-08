import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/mukta/latin-600.css';
import '@fontsource/mukta/devanagari-600.css';
import App from './App.jsx';
import { useEffect } from 'react';
import { initApi } from './api/client.js';
import { trackLoad, markApi, markMounted } from './lib/loader.js';

// Hands off from the inline loader (index.html): reports the first mount so it can wipe away.
function LoaderHandoff() {
  useEffect(markMounted, []);
  return null;
}

trackLoad();

initApi().finally(() => {
  markApi();
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <LoaderHandoff />
      <App />
    </React.StrictMode>,
  );
});
