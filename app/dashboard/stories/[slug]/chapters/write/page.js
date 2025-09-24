'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChapterEditor } from '@/components/ui/chapter-editor'
import Navbar from '@/components/navigation/Navbar'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Clock, AlertCircle, Calendar } from 'lucide-react'

export default function WriteChapter({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [slug, setSlug] = useState(null)
  const [story, setStory] = useState(null)
  const [chapter, setChapter] = useState({
    title: '',
    content: '',
    notes: '',
    status: 'draft',
    scheduledDate: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingChapter, setEditingChapter] = useState(null)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const loadStoryData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stories/${slug}`)

      if (!response.ok) {
        setError('Story not found or you do not have permission to edit it')
        setLoading(false)
        return
      }

      const data = await response.json()
      setStory(data.story)

      // Check if user is the author
      if (data.story.author.email !== session.user.email) {
        setError('You do not have permission to edit this story')
        setLoading(false)
        return
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading story:', error)
      setError('Failed to load story')
      setLoading(false)
    }
  }, [slug, session])

  useEffect(() => {
    if (slug && session) {
      loadStoryData()
    }
  }, [slug, session, loadStoryData])

  const handleSave = async ({ title, content, isDraft = false }) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!title.trim()) {
        setError('Chapter title is required')
        setSaving(false)
        return
      }

      if (!content.trim()) {
        setError('Chapter content is required')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/stories/${slug}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          notes: chapter.notes,
          status: isDraft ? 'draft' : chapter.status,
          scheduledDate: chapter.scheduledDate || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(isDraft ? 'Draft saved successfully!' : 'Chapter saved successfully!')

        if (!isDraft) {
          // Reset form after successful publish
          setChapter({
            title: '',
            content: '',
            notes: '',
            status: 'draft',
            scheduledDate: ''
          })

          // Redirect to chapter after a short delay
          setTimeout(() => {
            router.push(`/story/${slug}/chapter/${data.chapter.chapterNumber}`)
          }, 2000)
        }
      } else {
        setError(data.error || 'Failed to save chapter')
      }
    } catch (error) {
      console.error('Error saving chapter:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleTitleChange = (title) => {
    setChapter(prev => ({ ...prev, title }))
  }

  const handleContentChange = (content) => {
    setChapter(prev => ({ ...prev, content }))
  }

  const handlePublish = () => {
    handleSave({
      title: chapter.title,
      content: chapter.content,
      isDraft: false
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error && !story) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/stories/${slug}/chapters`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chapters
              </Link>
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Write New Chapter</h1>
          <p className="text-muted-foreground">
            Adding a new chapter to &quot;{story?.title}&quot;
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Chapter Content</CardTitle>
                <CardDescription>
                  Write your chapter using the rich text editor with auto-save functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChapterEditor
                  chapterTitle={chapter.title}
                  chapterContent={chapter.content}
                  onTitleChange={handleTitleChange}
                  onContentChange={handleContentChange}
                  onSave={handleSave}
                  autoSaveEnabled={true}
                  autoSaveInterval={30000}
                  minHeight="500px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chapter Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chapter Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={chapter.status}
                    onValueChange={(value) => setChapter(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {chapter.status === 'scheduled' && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Publish Date</Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={chapter.scheduledDate}
                      onChange={(e) => setChapter(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Author&apos;s Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Optional notes for readers..."
                    value={chapter.notes}
                    onChange={(e) => setChapter(prev => ({ ...prev, notes: e.target.value }))}
                    maxLength={500}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {chapter.notes.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handlePublish}
                  disabled={saving || !chapter.title.trim() || !chapter.content.trim()}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Publishing...' : 'Publish Chapter'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSave({ title: chapter.title, content: chapter.content, isDraft: true })}
                  disabled={saving || !chapter.title.trim() || !chapter.content.trim()}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <Link href={`/story/${slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Story
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Story Info */}
            {story && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Story Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {story.title}
                  </div>
                  <div>
                    <span className="font-medium">Genre:</span> {story.genre}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {story.status}
                  </div>
                  <div>
                    <span className="font-medium">Chapters:</span> {story.chaptersCount || 0}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}