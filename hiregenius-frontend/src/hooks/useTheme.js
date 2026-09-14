import { useEffect, useState } from 'react';

/**
 * useTheme — manages dark/light theme across the entire application.
 * Design system: :root = warm beige/olive (light, default).
 * Dark mode adds .dark class on <html>.
 * Default theme is 'light'. Persisted in localStorage.
 * Uses synchronized state listeners so all components update together.
 */
const THEME_KEY = 'hg_theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  // Fall back to DOM class or light default
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const listeners = new Set();

export const applyTheme = (theme) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // Ignore localStorage errors
  }
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
  }
  // Notify all active hook instances
  listeners.forEach((fn) => fn(theme));
  window.dispatchEvent(new CustomEvent('hg_theme_change', { detail: theme }));
};

const useTheme = () => {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    // Subscribe this component instance to theme updates
    const listener = (newTheme) => {
      setThemeState(newTheme);
    };
    listeners.add(listener);

    // Sync on initial mount
    const current = getInitialTheme();
    if (current !== theme) {
      setThemeState(current);
    }
    applyTheme(current);

    const handleCustomEvent = (e) => {
      if (e.detail && (e.detail === 'dark' || e.detail === 'light')) {
        setThemeState(e.detail);
      }
    };

    const handleStorage = (e) => {
      if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener('hg_theme_change', handleCustomEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('hg_theme_change', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const next = isCurrentlyDark ? 'light' : 'dark';
    setTheme(next);
  };

  return { theme, setTheme, toggleTheme };
};

export default useTheme;
