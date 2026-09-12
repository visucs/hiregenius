import { useEffect, useState } from 'react';

/**
 * useTheme — manages dark/light theme.
 * Design system: :root = warm beige/olive (light, default).
 * Dark mode adds .dark class on <html>.
 * Default theme is 'light'. Persisted in localStorage.
 */
const THEME_KEY = 'hg_theme';

const applyTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
  }
};

const useTheme = () => {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
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
