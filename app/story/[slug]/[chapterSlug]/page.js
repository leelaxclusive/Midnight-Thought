'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { StoryReader } from '@/components/ui/story-reader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ChapterPage() {
  const params = useParams()
  const [story, setStory] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (params.slug && params.chapterSlug) {
      loadChapter()
    }
  }, [params.slug, params.chapterSlug])

  const loadChapter = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load story data first
      const storyResponse = await fetch(`/api/stories/${params.slug}`)
      if (!storyResponse.ok) {
        throw new Error('Story not found')
      }
      const storyData = await storyResponse.json()
      setStory(storyData.story)

      // Load chapters for this story
      const chaptersResponse = await fetch(`/api/stories/${params.slug}/chapters`)
      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json()
        setChapters(chaptersData.chapters)

        // Find the current chapter from the chapters list
        const currentChapter = chaptersData.chapters.find(ch =>
          ch.slug === params.chapterSlug || ch.chapterNumber === parseInt(params.chapterSlug)
        )

        if (currentChapter) {
          // Load full chapter details including content
          const chapterResponse = await fetch(`/api/stories/${params.slug}/chapters/${currentChapter.chapterNumber}`)
          if (chapterResponse.ok) {
            const chapterData = await chapterResponse.json()
            setChapter(chapterData.chapter)
          } else {
            throw new Error('Chapter content not found')
          }
        } else {
          throw new Error('Chapter not found')
        }
      } else {
        throw new Error('Failed to load chapters')
      }

    } catch (err) {
      console.error('Error loading chapter:', err)
      setError('Failed to load chapter')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Chapter Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/explore">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Stories
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!story || !chapter) {
    return null
  }

  const nextChapter = chapter.chapterNumber < story.totalChapters ? {
    slug: 'chapter-2',
    title: 'Secrets of the Past',
    chapterNumber: chapter.chapterNumber + 1
  } : null

  const prevChapter = chapter.chapterNumber > 1 ? {
    slug: 'prologue',
    title: 'The Beginning',
    chapterNumber: chapter.chapterNumber - 1
  } : null

  return (
    <div className="min-h-screen bg-background">
      <StoryReader
        story={story}
        chapter={chapter}
        content={chapter.content}
        nextChapter={nextChapter}
        prevChapter={prevChapter}
        chapters={chapters}
      />
    </div>
  )
}