import { create } from 'zustand';

// Story state shared by the DOM sections and the canvas. The canvas reads it with getState() inside useFrame.
export const useStory = create((set) => ({
  tier: 'full', // 'full' | 'lite' | 'static'
  layout: 'desktop', // 'desktop' | 'phone'
  reduced: false,
  colourKey: 'black',
  setColour: (colourKey) => set({ colourKey }),
  setTier: (tier) => set({ tier }),
  setEnv: (patch) => set(patch),
  canvasReady: false,
  setCanvasReady: (canvasReady) => set({ canvasReady }),
  activeSection: 'story-hero',
  setActiveSection: (activeSection) => set({ activeSection }),
  // Add-to-cart flight request/state.
  anchorPreview: null, // { anchorKey: projected y px at the callouts hold pose } (FX2 card ordering)
  flightTimer: null, // safety-timer id for a running flight (cleared on landing)
  flightRequest: null, // { id, line }
  flightActive: false,
  requestFlight: (line) => set({ flightRequest: { id: Math.random(), line } , flightActive: true }),
  clearFlightRequest: () => set({ flightRequest: null }),
  endFlightState: () => set({ flightActive: false, flightRequest: null }),
}));

// Mutable registry of DOM overlay elements the canvas updates each frame (no React state).
export const overlay = {
  callouts: [], // { anchor, dot, line, text, textPoint:{x,y} }
  layers: [], // { anchor, dot, line, badge, textPoint }
  activeDot: null, // phone: single dot element
  size: { w: 1, h: 1 },
};
