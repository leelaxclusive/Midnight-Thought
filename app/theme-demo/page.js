'use client'
import { useTheme } from '@/lib/theme-context'
import { ThemeToggle, ReadingModeToggle } from '@/components/ui/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Palette,
  BookOpen,
  Heart,
  Star,
  MessageSquare
} from 'lucide-react'

export default function ThemeDemo() {
  const { theme, readingMode, isDark, mounted } = useTheme()

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading theme...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Theme Demo</h1>
            </div>
            <div className="flex items-center gap-2">
              <ReadingModeToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Theme Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Current Theme Settings
            </CardTitle>
            <CardDescription>
              Testing dark mode and reading mode functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme Mode</label>
                <div className="flex items-center gap-2">
                  {theme === 'light' && <Sun className="h-4 w-4" />}
                  {theme === 'dark' && <Moon className="h-4 w-4" />}
                  {theme === 'system' && <Monitor className="h-4 w-4" />}
                  <Badge variant="secondary">{theme}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reading Mode</label>
                <div className="flex items-center gap-2">
                  {readingMode === 'normal' && <Eye className="h-4 w-4" />}
                  {readingMode === 'focus' && <EyeOff className="h-4 w-4" />}
                  {readingMode === 'sepia' && <Palette className="h-4 w-4" />}
                  <Badge variant="secondary">{readingMode}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Computed Theme</label>
                <div className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <Badge variant={isDark ? 'default' : 'outline'}>
                    {isDark ? 'Dark' : 'Light'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Components Demo */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample Story Card */}
          <Card className="hover:shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">Fantasy</Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 mr-1" />
                  1,250
                </div>
              </div>
              <CardTitle className="line-clamp-2">The Midnight Chronicles</CardTitle>
              <CardDescription>by Sarah Chen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                A young mage discovers an ancient prophecy that could change everything she knows about her world. Journey through mystical realms and uncover secrets that have been hidden for centuries.
              </p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  15 chapters
                </div>
                <div className="flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  4.8
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Reading Progress</CardTitle>
              <CardDescription>Current chapter progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Chapter 1</span>
                  <span>75%</span>
                </div>
                <Progress value={75} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Story</span>
                  <span>45%</span>
                </div>
                <Progress value={45} />
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>📚 15 chapters</span>
                  <span>⏱️ 2h 30m read</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Elements</CardTitle>
              <CardDescription>Test various UI components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm">Primary</Button>
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="ghost" size="sm">Ghost</Button>
              </div>

              <div className="flex gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  42 likes
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  15 comments
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reading Mode Demo */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Reading Mode Demo</CardTitle>
              <CardDescription>
                Sample content that demonstrates reading mode styles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="reading-content story-content reading-enhanced">
                <h2>Chapter 1: The Ancient Library</h2>

                <p>
                  The ancient library stood silent in the moonlight, its towering shelves casting long shadows across the marble floor. Lyra Nightwhisper moved between the stacks with practiced silence, her fingertips trailing along the spines of countless volumes.
                </p>

                <p>
                  She had been searching for three days now, following a cryptic reference she'd found in her grandmother's journal. The old woman had been the most powerful mage in the kingdom before her mysterious disappearance twenty years ago.
                </p>

                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                  "When shadow meets light in the hour of need, the chosen one shall plant the seed of power that kingdoms are destined to reap."
                </blockquote>

                <p>
                  The words had haunted her dreams ever since she'd first read them. Tonight, under the cover of darkness, she had finally gathered the courage to breach the forbidden section of the library.
                </p>

                <h3>The Discovery</h3>

                <p>
                  Her hand paused on a leather-bound tome, its cover worn smooth by countless hands. Unlike the others, this book seemed to pulse with a faint, otherworldly energy. As her fingers made contact with the ancient binding, symbols began to glow along its surface.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
            <CardDescription>
              Instructions for testing the dark mode and reading mode functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Theme Toggle:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Click the theme toggle button in the header</li>
                  <li>• Choose between Light, Dark, or System theme</li>
                  <li>• System theme follows your OS preference</li>
                  <li>• Settings are saved in localStorage</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Reading Mode:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Normal: Standard reading experience</li>
                  <li>• Focus: Enhanced typography, reduced distractions</li>
                  <li>• Sepia: Warm colors for reduced eye strain</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}