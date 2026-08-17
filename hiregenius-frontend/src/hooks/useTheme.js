import { useEffect, useState } from 'react';

/**
 * useTheme — manages dark/light theme.
 * Design.md §2: Dark is the baseline (:root). Light mode uses .light class on <html>.
 * Default theme is 'dark'. Persisted in localStorage.
 */
const THEME_KEY = 'hg_theme';

const applyTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }
};

const useTheme = () => {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(THEME_KEY) || 'dark'
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return { theme, setTheme, toggleTheme };
};

export default useTheme;
