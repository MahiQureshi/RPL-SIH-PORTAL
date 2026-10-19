import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import './Controls.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rpl_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rpl_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      className="control-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-gold" />
      ) : (
        <Moon size={18} className="text-sky" />
      )}
      <span className="control-btn-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
