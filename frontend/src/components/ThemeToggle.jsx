import { Sun, Moon, GripHorizontal, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme, animationConfig, setAnimationConfig } = useTheme()
  const [showOptions, setShowOptions] = useState(false)

  const handleVariantChange = (variant) => {
    setAnimationConfig({ ...animationConfig, variant })
  }

  const handleStartChange = (start) => {
    setAnimationConfig({ ...animationConfig, start })
  }

  const handleBlurChange = (blur) => {
    setAnimationConfig({ ...animationConfig, blur })
  }

  const variants = ['circle', 'rectangle', 'polygon', 'circle-blur']
  const startPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']

  return (
    <div className="relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        }}
        aria-label="Toggle theme"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
            theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-purple-600" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-600" />
          )}
        </span>
      </button>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="ml-2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        aria-label="Toggle animation settings"
      >
        <ChevronDown className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
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
              {variants.map(variant => (
                <button
                  key={variant}
                  onClick={() => handleVariantChange(variant)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    animationConfig.variant === variant
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {variant}
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
              {startPositions.map(position => (
                <button
                  key={position}
                  onClick={() => handleStartChange(position)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    animationConfig.start === position
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {position}
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
  )
}
