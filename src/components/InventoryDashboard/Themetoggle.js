import React from 'react';
import { useTheme } from '../InventoryDashboard/Themecontext';
import './themecontext.css'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-slider">
        {theme === 'light' ? '☀️' : '🌙'}
      </div>
    </button>
  );
};

export default ThemeToggle;