import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createAnimation } from '../utils/themeAnimations'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) return savedTheme
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })

  const [animationConfig, setAnimationConfig] = useState({
    variant: 'circle',
    start: 'center',
    blur: false,
    gifUrl: ''
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove both classes first
    root.classList.remove('light', 'dark')
    
    // Add the current theme
    root.classList.add(theme)
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const updateAnimationStyles = useCallback((css, name) => {
    if (typeof window === 'undefined') return

    let styleElement = document.getElementById('theme-transition-styles')

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'theme-transition-styles'
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = css
  }, [])

  const toggleTheme = () => {
    const animation = createAnimation(
      animationConfig.variant,
      animationConfig.start,
      animationConfig.blur,
      animationConfig.gifUrl
    )

    updateAnimationStyles(animation.css, animation.name)

    if (typeof window === 'undefined') return

    const switchTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
    }

    if (!document.startViewTransition) {
      switchTheme()
      return
    }

    document.startViewTransition(switchTheme)
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      animationConfig,
      setAnimationConfig
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
