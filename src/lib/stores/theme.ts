import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'dynamo-wsr-theme';

function getInitialTheme(): Theme {
  if (browser) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return 'light';
}

function applyTheme(theme: Theme) {
  if (browser) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>(getInitialTheme());

  if (browser) applyTheme(getInitialTheme());

  return {
    subscribe,
    set(value: Theme) {
      set(value);
      applyTheme(value);
    },
    toggle() {
      update((current) => {
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        return next;
      });
    }
  };
}

export const theme = createThemeStore();
