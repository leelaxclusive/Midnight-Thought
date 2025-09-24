'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Navbar from '@/components/navigation/Navbar'
import Link from 'next/link'
import {
  BookOpen,
  Edit3,
  Eye,
  Heart,
  Trash2,
  Plus,
  Settings,
  FileText,
  Clock,
  Calendar,
  BarChart3,
  Filter,
  Search,
  MoreHorizontal,
  Download,
  Upload
} from 'lucide-react'

export default function StoryManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stories, setStories] = useState([])
  const [filteredStories, setFilteredStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [selectedStory, setSelectedStory] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState(null)

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    genre: '',
    tags: [],
    language: '',
    visibility: '',
    status: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadStories()
    }
  }, [session])

  useEffect(() => {
    filterStories()
  }, [stories, searchQuery, statusFilter, visibilityFilter])

  const loadStories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/stories')
      if (response.ok) {
        const data = await response.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error('Error loading stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterStories = useCallback(() => {
    let filtered = [...stories]

    if (searchQuery) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story.status === statusFilter)
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(story => story.visibility === visibilityFilter)
    }

    setFilteredStories(filtered)
  }, [stories, searchQuery, statusFilter, visibilityFilter])

  const openEditDialog = (story) => {
    setSelectedStory(story)
    setEditForm({
      title: story.title || '',
      description: story.description || '',
      genre: story.genre || '',
      tags: story.tags || [],
      language: story.language || 'English',
      visibility: story.visibility || 'public',
      status: story.status || 'draft'
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStory) return

    try {
      const response = await fetch(`/api/stories/${selectedStory.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setStories(stories.map(s => s._id === selectedStory._id ? data.story : s))
        setIsEditDialogOpen(false)
        setSelectedStory(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update story')
      }
    } catch (error) {
      console.error('Error updating story:', error)
      alert('Failed to update story')
    }
  }

  const handleDelete = async (story) => {
    try {
      const response = await fetch(`/api/stories/${story.slug}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStories(stories.filter(s => s._id !== story._id))
        setIsDeleteDialogOpen(false)
        setStoryToDelete(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete story')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Failed to delete story')
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'hiatus': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Story Management</h1>
            <p className="text-muted-foreground">Manage all your stories and chapters in one place</p>
          </div>
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/write">
                <Plus className="h-4 w-4 mr-2" />
                New Story
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Stories</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility-filter">Visibility</Label>
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setVisibilityFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Card key={story._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2 mb-2">{story.title}</CardTitle>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge className={getStatusColor(story.status)}>
                        {story.status}
                      </Badge>
                      <Badge variant="outline">
                        {story.visibility}
                      </Badge>
                      <Badge variant="secondary">
                        {story.genre}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(story)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {story.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{story.chaptersCount || 0} chapters</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{story.views || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>{story.likesCount || 0} likes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getTimeAgo(story.lastUpdated || story.createdAt)}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/dashboard/stories/${story.slug}/chapters`}>
                      <FileText className="h-4 w-4 mr-1" />
                      Chapters
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/story/${story.slug}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(story)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStoryToDelete(story)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStories.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No stories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || visibilityFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'You haven&apos;t created any stories yet'}
            </p>
            {!searchQuery && statusFilter === 'all' && visibilityFilter === 'all' && (
              <Button asChild>
                <Link href="/write">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Story
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Edit Story Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Story</DialogTitle>
              <DialogDescription>
                Update your story details and settings
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-genre">Genre</Label>
                  <Select value={editForm.genre} onValueChange={(value) => setEditForm({...editForm, genre: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Romance">Romance</SelectItem>
                      <SelectItem value="Fantasy">Fantasy</SelectItem>
                      <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                      <SelectItem value="Mystery">Mystery</SelectItem>
                      <SelectItem value="Thriller">Thriller</SelectItem>
                      <SelectItem value="Horror">Horror</SelectItem>
                      <SelectItem value="Adventure">Adventure</SelectItem>
                      <SelectItem value="Young Adult">Young Adult</SelectItem>
                      <SelectItem value="Drama">Drama</SelectItem>
                      <SelectItem value="Comedy">Comedy</SelectItem>
                      <SelectItem value="Historical Fiction">Historical Fiction</SelectItem>
                      <SelectItem value="Contemporary">Contemporary</SelectItem>
                      <SelectItem value="Paranormal">Paranormal</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-visibility">Visibility</Label>
                  <Select value={editForm.visibility} onValueChange={(value) => setEditForm({...editForm, visibility: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="hiatus">Hiatus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-language">Language</Label>
                <Input
                  id="edit-language"
                  value={editForm.language}
                  onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                  placeholder="English"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={editForm.tags.join(', ')}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                  placeholder="fantasy, magic, adventure"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Story
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Story</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{storyToDelete?.title}&quot;? This action cannot be undone and will also delete all associated chapters.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => storyToDelete && handleDelete(storyToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Story
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}