'use client'
import { useTheme } from '@/lib/theme-context'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu'
import {
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Palette,
  Settings
} from 'lucide-react'

export function ThemeToggle({ variant = 'icon', className }) {
  const {
    theme,
    readingMode,
    toggleTheme,
    setSpecificTheme,
    toggleReadingMode,
    setSpecificReadingMode,
    getCurrentTheme,
    mounted
  } = useTheme()

  if (!mounted) {
    return <Button variant="ghost" size="icon" className={className} disabled />
  }

  const currentTheme = mounted ? getCurrentTheme() : 'light'

  if (variant === 'simple') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={className}
        title={`Current theme: ${theme} (${currentTheme})`}
      >
        {currentTheme === 'dark' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          {currentTheme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">Theme</div>
        <DropdownMenuItem onClick={() => setSpecificTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSpecificTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSpecificTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-sm font-semibold">Reading Mode</div>
        <DropdownMenuItem onClick={() => setSpecificReadingMode('normal')}>
          <Eye className="mr-2 h-4 w-4" />
          Normal
          {readingMode === 'normal' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSpecificReadingMode('focus')}>
          <EyeOff className="mr-2 h-4 w-4" />
          Focus
          {readingMode === 'focus' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSpecificReadingMode('sepia')}>
          <Palette className="mr-2 h-4 w-4" />
          Sepia
          {readingMode === 'sepia' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ReadingModeToggle({ className }) {
  const { readingMode, toggleReadingMode, mounted } = useTheme()

  if (!mounted) {
    return <Button variant="ghost" size="icon" className={className} disabled />
  }

  const getIcon = () => {
    switch (readingMode) {
      case 'focus':
        return <EyeOff className="h-4 w-4" />
      case 'sepia':
        return <Palette className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getTooltip = () => {
    switch (readingMode) {
      case 'focus':
        return 'Focus mode: Reduced distractions'
      case 'sepia':
        return 'Sepia mode: Easy on the eyes'
      default:
        return 'Normal mode'
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleReadingMode}
      className={className}
      title={getTooltip()}
    >
      {getIcon()}
    </Button>
  )
}

export default ThemeToggle