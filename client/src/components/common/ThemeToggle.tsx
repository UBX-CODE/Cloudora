import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center w-9 h-9 curvy-edge-sm border border-sand-300 dark:border-sand-800 bg-parchment-100/90 dark:bg-espresso-900/90 hover:bg-sand-200 dark:hover:bg-espresso-800 text-espresso-700 dark:text-parchment-300 hover:text-espresso-950 dark:hover:text-parchment-100 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-ochre-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-espresso-700 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};

