import { create } from 'zustand';

// Admin console preferences (per viewer, best effort: storage can be blocked) and the shell's page header.
const KEY = 'gs-admin-prefs';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};
const write = (prefs) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
};

const initial = read();

export const useAdmin = create((set, get) => ({
  mode: initial.mode === 'dark' ? 'dark' : 'light',
  collapsed: !!initial.collapsed,
  drawerOpen: false,
  title: '',
  crumbs: [],
  toggleMode: () => {
    const mode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode });
    write({ mode, collapsed: get().collapsed });
  },
  toggleCollapsed: () => {
    const collapsed = !get().collapsed;
    set({ collapsed });
    write({ mode: get().mode, collapsed });
  },
  setDrawer: (drawerOpen) => set({ drawerOpen }),
  setPage: (title, crumbs = []) => set({ title, crumbs }),
}));
