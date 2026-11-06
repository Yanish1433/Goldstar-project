import '@testing-library/jest-dom/vitest';

if (!window.matchMedia) {
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
}
class RO { observe() {} unobserve() {} disconnect() {} }
class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
window.ResizeObserver = window.ResizeObserver || RO;
window.IntersectionObserver = window.IntersectionObserver || IO;
window.scrollTo = () => {};
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
