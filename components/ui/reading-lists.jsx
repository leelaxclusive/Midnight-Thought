'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Badge } from './badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import {
  BookOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export function ReadingListsManager({ className }) {
  const { data: session } = useSession()
  const [readingLists, setReadingLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [newListForm, setNewListForm] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  useEffect(() => {
    if (session) {
      loadReadingLists()
    }
  }, [session])

  const loadReadingLists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/reading-lists')

      if (response.ok) {
        const data = await response.json()
        setReadingLists(data.readingLists || [])
      }
    } catch (error) {
      console.error('Error loading reading lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const createReadingList = async (e) => {
    e.preventDefault()

    if (!newListForm.name.trim()) {
      alert('List name is required')
      return
    }

    try {
      const response = await fetch('/api/user/reading-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newListForm)
      })

      const data = await response.json()

      if (response.ok) {
        setReadingLists(prev => [...prev, data.readingList])
        setNewListForm({ name: '', description: '', isPublic: false })
        setShowCreateDialog(false)
      } else {
        alert(data.error || 'Failed to create reading list')
      }
    } catch (error) {
      console.error('Error creating reading list:', error)
      alert('Failed to create reading list')
    }
  }

  const updateReadingList = async (listId, updates) => {
    try {
      const response = await fetch(`/api/user/reading-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        setReadingLists(prev =>
          prev.map(list =>
            list._id === listId ? { ...list, ...updates } : list
          )
        )
        setEditingList(null)
      } else {
        alert(data.error || 'Failed to update reading list')
      }
    } catch (error) {
      console.error('Error updating reading list:', error)
      alert('Failed to update reading list')
    }
  }

  const deleteReadingList = async (listId) => {
    if (!confirm('Are you sure you want to delete this reading list?')) {
      return
    }

    try {
      const response = await fetch(`/api/user/reading-lists/${listId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReadingLists(prev => prev.filter(list => list._id !== listId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete reading list')
      }
    } catch (error) {
      console.error('Error deleting reading list:', error)
      alert('Failed to delete reading list')
    }
  }

  const removeStoryFromList = async (listId, storyId) => {
    try {
      const response = await fetch(`/api/user/reading-lists/${listId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storyId,
          action: 'remove'
        })
      })

      if (response.ok) {
        setReadingLists(prev =>
          prev.map(list =>
            list._id === listId
              ? { ...list, stories: list.stories.filter(story => story._id !== storyId) }
              : list
          )
        )
      }
    } catch (error) {
      console.error('Error removing story from list:', error)
    }
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sign in to manage your reading lists</p>
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
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Reading Lists</h2>
          <p className="text-muted-foreground">Organize your favorite stories</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reading List</DialogTitle>
              <DialogDescription>
                Create a new list to organize your favorite stories
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createReadingList} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">List Name</Label>
                <Input
                  id="name"
                  value={newListForm.name}
                  onChange={(e) => setNewListForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter list name..."
                  maxLength={50}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newListForm.description}
                  onChange={(e) => setNewListForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your reading list..."
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={newListForm.isPublic}
                  onChange={(e) => setNewListForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-border"
                />
                <Label htmlFor="isPublic">Make this list public</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create List</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {readingLists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reading Lists</h3>
            <p className="text-muted-foreground mb-4">
              Create your first reading list to organize your favorite stories
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {readingLists.map((list) => (
            <Card key={list._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      <Badge variant={list.isPublic ? "default" : "secondary"}>
                        {list.isPublic ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                        {list.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    {list.description && (
                      <CardDescription>{list.description}</CardDescription>
                    )}
                    <div className="text-sm text-muted-foreground mt-2">
                      {list.stories?.length || 0} {list.stories?.length === 1 ? 'story' : 'stories'}
                      {list.updatedAt && (
                        <>
                          {' • '}
                          Updated {new Date(list.updatedAt).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingList(list)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteReadingList(list._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {list.stories && list.stories.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {list.stories.slice(0, 3).map((story) => (
                      <div key={story._id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/story/${story.slug}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {story.title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>by {story.author?.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {story.genre}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStoryFromList(list._id, story._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {list.stories.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{list.stories.length - 3} more stories
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingList && (
        <Dialog open={!!editingList} onOpenChange={() => setEditingList(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Reading List</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateReadingList(editingList._id, {
                  name: editingList.name,
                  description: editingList.description,
                  isPublic: editingList.isPublic
                })
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>List Name</Label>
                <Input
                  value={editingList.name}
                  onChange={(e) => setEditingList(prev => ({ ...prev, name: e.target.value }))}
                  maxLength={50}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingList.description || ''}
                  onChange={(e) => setEditingList(prev => ({ ...prev, description: e.target.value }))}
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingList.isPublic}
                  onChange={(e) => setEditingList(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-border"
                />
                <Label>Make this list public</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingList(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ReadingListsManager