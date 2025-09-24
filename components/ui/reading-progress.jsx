'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Progress } from './progress'
import {
  BookOpen,
  Clock,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

export function ReadingProgressTracker({ className }) {
  const { data: session } = useSession()
  const [readingProgress, setReadingProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      loadReadingProgress()
    }
  }, [session])

  const loadReadingProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/reading-progress?limit=20')

      if (response.ok) {
        const data = await response.json()
        setReadingProgress(data.readingProgress || [])
      }
    } catch (error) {
      console.error('Error loading reading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeProgress = async (storyId) => {
    if (!confirm('Are you sure you want to remove this reading progress?')) {
      return
    }

    try {
      const response = await fetch(`/api/user/reading-progress?storyId=${storyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReadingProgress(prev => prev.filter(progress => progress.story._id !== storyId))
      }
    } catch (error) {
      console.error('Error removing reading progress:', error)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sign in to track your reading progress</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Reading Progress</h2>
        <p className="text-muted-foreground">Continue where you left off</p>
      </div>

      {readingProgress.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reading Progress</h3>
            <p className="text-muted-foreground mb-4">
              Start reading some stories to track your progress
            </p>
            <Button asChild>
              <Link href="/explore">
                <BookOpen className="h-4 w-4 mr-2" />
                Discover Stories
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {readingProgress.map((progress) => {
            const story = progress.story
            if (!story) return null

            return (
              <Card key={progress._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1 mb-2">
                        <Link href={`/story/${story.slug}`} className="hover:underline">
                          {story.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">
                          by {story.author?.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {story.genre}
                        </Badge>
                        <Badge variant={story.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {story.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {story.description}
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProgress(story._id)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Chapter {progress.chapterNumber} of {progress.totalChapters || '?'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {progress.progressPercentage || 0}% complete
                      </span>
                    </div>
                    <Progress value={progress.progressPercentage || 0} className="h-2" />
                  </div>

                  {/* Reading Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-foreground">
                        {progress.lastChapter?.title || 'Unknown Chapter'}
                      </div>
                      <div className="text-xs text-muted-foreground">Last Chapter</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">
                        {formatTime(progress.totalTimeRead || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Time Read</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">
                        {getTimeAgo(progress.lastRead)}
                      </div>
                      <div className="text-xs text-muted-foreground">Last Read</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/story/${story.slug}/chapter/${progress.chapterNumber}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Reading
                      </Link>
                    </Button>

                    <Button variant="outline" asChild>
                      <Link href={`/story/${story.slug}/chapter/1`}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Start Over
                      </Link>
                    </Button>

                    <Button variant="outline" asChild>
                      <Link href={`/story/${story.slug}`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Story Info
                      </Link>
                    </Button>
                  </div>

                  {/* Completion Badge */}
                  {progress.isCompleted && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ReadingProgressTracker