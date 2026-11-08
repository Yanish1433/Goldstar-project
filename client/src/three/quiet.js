import { setConsoleFunction } from 'three';

// react-three-fiber 9 still constructs a THREE.Clock internally, and three r183+ warns about that on every canvas.
// It is upstream and harmless; drop just that one message and pass every other three.js log through untouched.
const UPSTREAM = 'THREE.Clock: This module has been deprecated';
setConsoleFunction((type, message, ...params) => {
  if (typeof message === 'string' && message.startsWith(UPSTREAM)) return;
  (console[type] || console.log)(message, ...params);
});
