'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navigation/Navbar'
import Link from 'next/link'
import { BookOpen, Heart, Clock, Search, BookmarkIcon, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { LoadingStoryCard, LoadingList } from '@/components/ui/loading'

export default function Library() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('reading')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [loading, setLoading] = useState(true)

  const [readingList, setReadingList] = useState([])
  const [savedStories, setSavedStories] = useState([])
  const [readingHistory, setReadingHistory] = useState([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadUserLibrary()
    }
  }, [session])

  const loadUserLibrary = async () => {
    try {
      setLoading(true)

      // Load Currently Reading stories
      const currentlyReadingResponse = await fetch('/api/user/currently-reading')
      if (currentlyReadingResponse.ok) {
        const currentlyReadingData = await currentlyReadingResponse.json()
        setReadingList(currentlyReadingData.currentlyReading || [])
      }

      // Load Saved Stories
      const savedStoriesResponse = await fetch('/api/user/saved-stories')
      if (savedStoriesResponse.ok) {
        const savedStoriesData = await savedStoriesResponse.json()
        setSavedStories(savedStoriesData.savedStories || [])
      }

      // Load Reading History
      const historyResponse = await fetch('/api/user/reading-history')
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setReadingHistory(historyData.history || [])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading library:', error)
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
  }

  const getCurrentList = () => {
    switch (activeTab) {
      case 'reading':
        return readingList
      case 'saved':
        return savedStories
      case 'history':
        return readingHistory
      default:
        return []
    }
  }

  const filteredList = getCurrentList().filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const removeFromList = async (id) => {
    if (activeTab === 'saved') {
      try {
        const response = await fetch(`/api/user/saved-stories?storyId=${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setSavedStories(prev => prev.filter(item => item.id !== id))
        } else {
          console.error('Failed to remove from saved stories')
        }
      } catch (error) {
        console.error('Error removing from saved:', error)
      }
    } else if (activeTab === 'reading') {
      try {
        const response = await fetch(`/api/user/currently-reading?storyId=${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setReadingList(prev => prev.filter(item => item.id !== id))
        } else {
          console.error('Failed to remove from currently reading')
        }
      } catch (error) {
        console.error('Error removing from reading list:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Library</h1>
          <p className="text-muted-foreground">
            Manage your reading list, saved stories, and reading history
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reading')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reading'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <BookOpen className="h-4 w-4 inline-block mr-2" />
                Currently Reading ({readingList.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'saved'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <BookmarkIcon className="h-4 w-4 inline-block mr-2" />
                Saved Stories ({savedStories.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <Clock className="h-4 w-4 inline-block mr-2" />
                Reading History ({readingHistory.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your library..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="author">Author A-Z</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {activeTab === 'reading' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{story.genre}</Badge>
                    <Badge variant={story.status === 'completed' ? 'default' : 'outline'}>
                      {story.status}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                  <CardDescription>
                    by <Link href={`/profile/${story.author.username}`} className="hover:underline">
                      {story.author.name}
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress: {story.progress}%</span>
                      <span>Chapter {story.currentChapter}/{story.totalChapters}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${story.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last read {getTimeAgo(story.lastRead)}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button asChild className="flex-1">
                      <Link href={`/story/${story.slug}/chapter/${story.currentChapter || 1}`}>
                        Continue Reading
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromList(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{story.genre}</Badge>
                    <Badge variant={story.status === 'completed' ? 'default' : 'outline'}>
                      {story.status}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                  <CardDescription>
                    by <Link href={`/profile/${story.author.username}`} className="hover:underline">
                      {story.author.name}
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {story.description}
                  </p>

                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {story.chapters} chapters
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Created {getTimeAgo(new Date(story.createdAt))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button asChild className="flex-1">
                      <Link href={`/story/${story.slug}`}>
                        Read Story
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromList(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{story.genre}</Badge>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`h-3 w-3 ${
                            i < story.rating ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                  <CardDescription>
                    by <Link href={`/profile/${story.author.username}`} className="hover:underline">
                      {story.author.name}
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {story.chapters} chapters
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Completed {getTimeAgo(story.completedAt)}
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/story/${story.slug}`}>
                      Read Again
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredList.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {activeTab === 'reading' && 'No stories in your reading list'}
              {activeTab === 'saved' && 'No saved stories'}
              {activeTab === 'history' && 'No reading history'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === 'reading' && 'Start reading some stories to see them here.'}
              {activeTab === 'saved' && 'Save stories you want to read later.'}
              {activeTab === 'history' && 'Complete some stories to build your reading history.'}
            </p>
            <Button asChild>
              <Link href="/explore">
                Discover Stories
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}