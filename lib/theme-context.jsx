'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system')
  const [readingMode, setReadingMode] = useState('normal')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system'
    const savedReadingMode = localStorage.getItem('reading-mode') || 'normal'

    setTheme(savedTheme)
    setReadingMode(savedReadingMode)
    setMounted(true)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Apply reading mode
    root.classList.remove('reading-mode-normal', 'reading-mode-focus', 'reading-mode-sepia')
    root.classList.add(`reading-mode-${readingMode}`)

    // Save to localStorage
    localStorage.setItem('theme', theme)
    localStorage.setItem('reading-mode', readingMode)
  }, [theme, readingMode, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(mediaQuery.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const setSpecificTheme = (newTheme) => {
    setTheme(newTheme)
  }

  const toggleReadingMode = () => {
    if (readingMode === 'normal') {
      setReadingMode('focus')
    } else if (readingMode === 'focus') {
      setReadingMode('sepia')
    } else {
      setReadingMode('normal')
    }
  }

  const setSpecificReadingMode = (mode) => {
    setReadingMode(mode)
  }

  const getCurrentTheme = () => {
    if (theme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light' // Default fallback for SSR
    }
    return theme
  }

  const value = {
    theme,
    readingMode,
    mounted,
    toggleTheme,
    setSpecificTheme,
    toggleReadingMode,
    setSpecificReadingMode,
    getCurrentTheme,
    isDark: mounted ? getCurrentTheme() === 'dark' : false,
    isSystem: theme === 'system'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}