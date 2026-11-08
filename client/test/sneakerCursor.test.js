import { afterEach, describe, expect, it, vi } from 'vitest';
import { CURSOR_QUERY, REDUCED_QUERY, mountSneakerCursor, shouldEnableCursor } from '../src/lib/sneakerCursor.js';

// A window whose media queries answer from a set.
const fakeWin = (matches) => {
  const raf = vi.fn(() => 1);
  return Object.assign(Object.create(window), {
    matchMedia: (q) => ({ matches: matches.includes(q), media: q, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: raf,
    cancelAnimationFrame: vi.fn(),
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    performance: window.performance,
    Element: window.Element,
    __raf: raf,
  });
};

const move = (x, y, target = document.body) => {
  const e = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(e, 'pointerType', { value: 'mouse' });
  target.dispatchEvent(e);
};

let cleanup = () => {};
afterEach(() => {
  cleanup();
  cleanup = () => {};
  document.body.innerHTML = '';
});

describe('Sneaker cursor guards', () => {
  it('stays off on touch / coarse pointers: nothing mounted, native cursor kept', () => {
    const win = fakeWin([]);
    expect(shouldEnableCursor(win)).toBe(false);
    cleanup = mountSneakerCursor({ win, doc: document });
    expect(document.querySelector('.gs-cursor-root')).toBeNull();
    move(10, 10);
    expect(document.documentElement.classList.contains('gs-cursor')).toBe(false);
  });

  it('mounts on a fine hover pointer and only hides the native cursor after the first move', () => {
    const win = fakeWin([CURSOR_QUERY]);
    expect(shouldEnableCursor(win)).toBe(true);
    cleanup = mountSneakerCursor({ win, doc: document });
    const root = document.querySelector('.gs-cursor-root');
    expect(root).not.toBeNull();
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.dataset.mode).toBe('animated');
    expect(document.documentElement.classList.contains('gs-cursor')).toBe(false);
    move(40, 50);
    expect(document.documentElement.classList.contains('gs-cursor')).toBe(true);
    expect(root.dataset.hidden).toBe('false');
  });

  it('reduced motion: a static boot pinned to the pointer, no animation loop, no tread prints', () => {
    const win = fakeWin([CURSOR_QUERY, REDUCED_QUERY]);
    cleanup = mountSneakerCursor({ win, doc: document });
    const root = document.querySelector('.gs-cursor-root');
    expect(root.dataset.mode).toBe('static');
    expect(root.querySelectorAll('.gs-cursor-print')).toHaveLength(0);
    move(120, 80);
    move(300, 300);
    expect(win.__raf).not.toHaveBeenCalled();
    expect(root.querySelector('.gs-cursor-boot').style.transform).toContain('translate3d(300px, 300px, 0)');
  });

  it('hides the boot over text fields (native text cursor) and kicks over buttons', () => {
    const win = fakeWin([CURSOR_QUERY]);
    cleanup = mountSneakerCursor({ win, doc: document });
    document.body.insertAdjacentHTML('beforeend', '<input id="t" type="text"><button id="b">Go</button>');
    const root = document.querySelector('.gs-cursor-root');
    move(5, 5, document.getElementById('t'));
    expect(root.dataset.hidden).toBe('true');
    move(6, 6, document.getElementById('b'));
    expect(root.dataset.hidden).toBe('false');
    expect(root.dataset.hover).toBe('true');
  });

  it('cleans up completely', () => {
    const win = fakeWin([CURSOR_QUERY]);
    const off = mountSneakerCursor({ win, doc: document });
    move(1, 1);
    off();
    expect(document.querySelector('.gs-cursor-root')).toBeNull();
    expect(document.documentElement.classList.contains('gs-cursor')).toBe(false);
  });
});
