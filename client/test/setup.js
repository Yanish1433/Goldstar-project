// jest-dom's matchers, extended onto this runner's own `expect`. ('@testing-library/jest-dom/vitest' is loaded as an
// external module under vitest 5 and extends a second copy of `expect`, so every toBeInTheDocument failed with
// "Invalid Chai property".)
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

if (!window.matchMedia) {
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
}
class RO { observe() {} unobserve() {} disconnect() {} }
class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
window.ResizeObserver = window.ResizeObserver || RO;
window.IntersectionObserver = window.IntersectionObserver || IO;
window.scrollTo = () => {};
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
// jsdom has no layout: Range rects are missing (LineReveal measures lines from an rAF).
if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [];
  Range.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
}
