'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navigation/Navbar'
import Link from 'next/link'
import { BookOpen, Users, Heart, Clock, Search, Filter } from 'lucide-react'

export default function Explore() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const genres = [
    'Romance', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
    'Horror', 'Adventure', 'Young Adult', 'Drama', 'Comedy',
    'Historical Fiction', 'Contemporary', 'Paranormal', 'Other'
  ]

  useEffect(() => {
    loadStories()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadStories()
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    loadStories()
  }, [selectedGenre, sortBy])

  const loadStories = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedGenre !== 'all') params.append('genre', selectedGenre)
      params.append('sortBy', sortBy)
      // Don't filter by status, show all published stories (ongoing and completed)
      params.append('limit', '20')

      const response = await fetch(`/api/stories?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setStories(data.stories)
      } else {
        console.error('Failed to fetch stories')
        setStories([])
      }
    } catch (error) {
      console.error('Error loading stories:', error)
      setStories([])
    } finally {
      setLoading(false)
    }
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

  // Stories are already filtered and sorted by the API
  const filteredStories = stories

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Stories</h1>
          <p className="text-muted-foreground">
            Explore thousands of stories from talented writers around the world
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories, authors, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="popular">Most Liked</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'} found
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Card key={story._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{story.genre}</Badge>
                  <Badge variant={story.status === 'completed' ? 'default' : 'outline'}>
                    {story.status}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                <CardDescription>
                  by <Link href={`/profile/${story.author?.username}`} className="hover:underline">
                    {story.author?.name}
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {story.description}
                </p>

                {story.tags && story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {story.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {story.likesCount || 0}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {story.chaptersCount || 0} chapters
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeAgo(new Date(story.lastUpdated || story.createdAt))}
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/story/${story.slug}`}>
                    Read Story
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No stories found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}