import React, { useState, useCallback, useEffect } from 'react';
import { createAnimation } from '../lib/themeAnimations';

interface ThemeToggleProps {
  variant?: 'circle' | 'rectangle' | 'gif' | 'polygon' | 'circle-blur';
  start?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'top-center' | 'bottom-center';
  blur?: boolean;
  gifUrl?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'circle',
  start = 'center',
  blur = false,
  gifUrl = '',
}) => {
  const [isDark, setIsDark] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [animationConfig, setAnimationConfig] = useState({
    variant,
    start,
    blur,
    gifUrl,
  });

  // Sync isDark state with current theme after hydration
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const styleId = 'theme-transition-styles';

  const updateStyles = useCallback((css: string, name: string) => {
    if (typeof window === 'undefined') return;

    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(!isDark);

    const animation = createAnimation(
      animationConfig.variant,
      animationConfig.start,
      animationConfig.blur,
      animationConfig.gifUrl
    );

    updateStyles(animation.css, animation.name);

    if (typeof window === 'undefined') return;

    const switchTheme = () => {
      const root = document.documentElement;
      root.classList.toggle('dark');
      
      // Save preference
      const isDarkNow = root.classList.contains('dark');
      localStorage.setItem('theme-preference', isDarkNow ? 'dark' : 'light');
    };

    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    document.startViewTransition(switchTheme);
  }, [isDark, animationConfig, updateStyles]);

  const handleVariantChange = (newVariant: string) => {
    setAnimationConfig({ ...animationConfig, variant: newVariant as any });
  };

  const handleStartChange = (newStart: string) => {
    setAnimationConfig({ ...animationConfig, start: newStart as any });
  };

  const handleBlurChange = (newBlur: boolean) => {
    setAnimationConfig({ ...animationConfig, blur: newBlur });
  };

  const variants = ['circle', 'rectangle', 'polygon', 'circle-blur'];
  const startPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];

  return (
    <div className="relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        }}
        aria-label="Toggle theme"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
            isDark ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" />
              <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </span>
      </button>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="ml-2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        aria-label="Toggle animation settings"
      >
        <svg
          className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {/* Options Panel */}
      {showOptions && (
        <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Animation Settings</h3>
            <button
              onClick={() => setShowOptions(false)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>

          {/* Variant Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Animation Variant
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v}
                  onClick={() => handleVariantChange(v)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    animationConfig.variant === v
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Start Position Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Position
            </label>
            <div className="flex flex-wrap gap-2">
              {startPositions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => handleStartChange(pos)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    animationConfig.start === pos
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Blur Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Blur Effect
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleBlurChange(false)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                  !animationConfig.blur
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Off
              </button>
              <button
                onClick={() => handleBlurChange(true)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                  animationConfig.blur
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                On
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
