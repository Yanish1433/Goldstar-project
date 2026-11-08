import { create } from 'zustand';

// Per-frame state shared by the scroll engine (writer) and the canvas (reader). Plain mutable object:
// reading it in useFrame costs nothing and never re-renders React.
export const live = {
  T: 0, // story time in vh units (see storyline.js)
  vh: 1, // px per vh unit (window.innerHeight / 100)
  lastMove: 0, // performance.now() of the last change (idle frames are skipped)
  pending: 0, // frames still owed after the last change (slow devices still get the final pose)
  reduced: false,
  // Studio interaction (pointer drag + zoom), eased in the scene.
  drag: { yaw: 0, pitch: 0, zoom: 1, active: false },
  // Anatomy label DOM nodes, filled by <AnatomyLabels/>, positioned by the scene each frame.
  labels: null,
  // Optional: the canvas registers this so the DOM can ask for a frame (reduced motion, colour change).
  invalidate: null,
};

export const touch = () => {
  live.lastMove = performance.now();
  live.pending = 3;
};

// Low-frequency UI state (React subscribes to this).
export const useStoryUi = create((set) => ({
  tier: 'full', // 'full' | 'lite' | 'static'
  layout: 'desktop', // 'desktop' | 'phone'
  reduced: false,
  section: 0, // index of the current section
  canvasReady: false,
  stageFailed: false, // the 3D could not load: the page carries on without it
  colourKey: null, // current colourway key (scroll or user)
  userColour: null, // set when the user picks a swatch; wins over the scroll
  set: (patch) => set(patch),
}));

// Dev-only handle for debugging and the screenshot scripts.
if (import.meta.env?.DEV && typeof window !== 'undefined') window.__story = live;
