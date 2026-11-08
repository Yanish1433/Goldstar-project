import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = { '/api': { target: 'http://127.0.0.1:5050', changeOrigin: false } };

// Absolute origin for share-card URLs (og:image). Set SITE_URL=https://example.com when building for a real host;
// without it the tags are root-relative.
const siteUrl = () => ({ name: 'site-url', transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', (process.env.SITE_URL || '').replace(/\/$/, '')) });

export default defineConfig({
  plugins: [react(), siteUrl()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: {
    // The 3D chunk (three + react-three + drei, ~1.05 MB / 285 kB gzip) is one lazy chunk that only 3D routes load,
    // after first paint. Manual chunk groups were tried and rejected: they pulled shared modules (react, zustand) into
    // the 3D chunks and so preloaded three.js on every page.
    chunkSizeWarningLimit: 1100,
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.js'], testTimeout: 20000 },
});
