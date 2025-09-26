'use client'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/lib/theme-context'
import { markdownToHtml } from './markdown-editor'
import { ThemeToggle, ReadingModeToggle } from './theme-toggle'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Progress } from './progress'
import { Badge } from './badge'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  BookOpen,
  Share2,
  Bookmark,
  BookmarkCheck,
  Settings2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu'

export function StoryReader({ story, chapter, content, nextChapter, prevChapter, chapters = [], className }) {
  const { readingMode } = useTheme()
  const [readingProgress, setReadingProgress] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [speechSynthesis, setSpeechSynthesis] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const contentRef = useRef(null)
  const readingTimerRef = useRef(null)

  // Initialize reading session
  useEffect(() => {
    setIsReading(true)
    const startTime = Date.now()

    readingTimerRef.current = setInterval(() => {
      setReadingTime(prev => prev + 1)
    }, 1000)

    // Save reading session on unmount
    return () => {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current)
      }

      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      // Save reading session to backend
      saveReadingSession(timeSpent)
    }
  }, [])

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const element = contentRef.current
      const totalHeight = element.scrollHeight - element.clientHeight
      const scrolled = element.scrollTop

      if (totalHeight > 0) {
        const progress = Math.min((scrolled / totalHeight) * 100, 100)
        setReadingProgress(progress)

        // Update CSS custom property for progress bar
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--progress', `${progress}%`)
        }
      }
    }

    const element = contentRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Speech synthesis setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis)
    }
  }, [])

  const saveReadingSession = async (timeSpent) => {
    try {
      await fetch(`/api/chapters/${chapter.id}/reading-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpent,
          progress: readingProgress,
          completed: readingProgress > 95
        })
      })
    } catch (error) {
      console.error('Error saving reading session:', error)
    }
  }

  const handleTextToSpeech = () => {
    if (!speechSynthesis) return

    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const text = contentRef.current?.textContent || content
      const utterance = new SpeechSynthesisUtterance(text)

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getFontSizeClass = () => {
    if (fontSize <= 14) return 'text-sm'
    if (fontSize <= 16) return 'text-base'
    if (fontSize <= 18) return 'text-lg'
    if (fontSize <= 20) return 'text-xl'
    return 'text-2xl'
  }

  return (
    <div className={`story-reader ${className}`}>
      {/* Reading Progress Bar */}
      <div className="reading-progress"></div>

      {/* Reading Header */}
      <div className={`sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b ${readingMode === 'focus' ? 'hide-in-focus' : ''}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href={`/story/${story.slug}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Story
                </a>
              </Button>
              <div>
                <h1 className="font-semibold text-lg">{chapter.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Chapter {chapter.chapterNumber} • {chapter.wordCount} words • {chapter.readingTime} min read
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reading Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(readingTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {Math.round(readingProgress)}%
                </div>
              </div>

              {/* Reader Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold">Reader Settings</div>

                  <DropdownMenuItem onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
                    <span className="mr-2">A-</span>
                    Decrease font size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize(Math.min(24, fontSize + 2))}>
                    <span className="mr-2">A+</span>
                    Increase font size
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.2))}>
                    Line height: Tighter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.2))}>
                    Line height: Looser
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleTextToSpeech}>
                    {isSpeaking ? (
                      <>
                        <VolumeX className="mr-2 h-4 w-4" />
                        Stop reading
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        Read aloud
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ReadingModeToggle />
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Hidden in focus mode */}
          <div className={`lg:col-span-1 space-y-6 reading-sidebar ${readingMode === 'focus' ? 'hidden lg:block' : ''}`}>
            {/* Reading Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Reading Progress</span>
                    <span>{Math.round(readingProgress)}%</span>
                  </div>
                  <Progress value={readingProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Reading time: {formatTime(readingTime)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-medium">{story.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {story.author.name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {story.genres?.map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table of Contents */}
            {chapters.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Table of Contents</h3>
                      <Badge variant="outline" className="text-xs">
                        {chapters.length} chapters
                      </Badge>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      {chapters.map((chapterItem) => (
                        <a
                          key={chapterItem._id || chapterItem.id}
                          href={`/story/${story.slug}/chapter/${chapterItem.chapterNumber}`}
                          className={`flex items-center gap-2 p-2 rounded-md text-xs transition-colors hover:bg-accent ${
                            chapterItem.chapterNumber === chapter.chapterNumber
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            chapterItem.chapterNumber === chapter.chapterNumber
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {chapterItem.chapterNumber}
                          </div>
                          <span className="flex-1 truncate">
                            {chapterItem.title}
                          </span>
                          {chapterItem.chapterNumber === chapter.chapterNumber && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content */}
          <div className={`${readingMode === 'focus' ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
            <div
              ref={contentRef}
              className={`reading-content story-content reading-enhanced ${getFontSizeClass()}`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto'
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
                className="prose dark:prose-invert max-w-none"
              />
            </div>

            {/* Chapter Navigation */}
            <div className={`flex items-center justify-between mt-8 pt-8 border-t reading-navigation`}>
              <div>
                {prevChapter ? (
                  <Button variant="outline" asChild>
                    <a href={`/story/${story.slug}/${prevChapter.slug}`}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous: {prevChapter.title}
                    </a>
                  </Button>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Chapter {chapter.chapterNumber} of {story.totalChapters}
                </p>
              </div>

              <div>
                {nextChapter ? (
                  <Button asChild>
                    <a href={`/story/${story.slug}/${nextChapter.slug}`}>
                      Next: {nextChapter.title}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <a href={`/story/${story.slug}`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Story Complete
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryReader