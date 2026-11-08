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
    // three.js is one ~700 kB module graph: split it from react-three/drei so no chunk passes the limit.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/](@react-three|three-stdlib|three-mesh-bvh|troika|maath|camera-controls)/ },
          ],
        },
      },
    },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.js'], testTimeout: 20000 },
});
