'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Badge } from './badge'
import { Progress } from './progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { StarRating, StarDisplay } from './star-rating'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  ChevronDown,
  Filter
} from 'lucide-react'
import Link from 'next/link'

export function StoryReviews({ storySlug, className }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState([])
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: ''
  })

  useEffect(() => {
    loadReviews()
  }, [storySlug, sortBy])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stories/${storySlug}/reviews?sortBy=${sortBy}&limit=20`)

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setRatingStats(data.rating || { average: 0, count: 0, distribution: {} })

        // Check if current user has reviewed
        if (session) {
          const userReview = data.reviews.find(
            review => review.user._id === session.user.id || review.user.email === session.user.email
          )
          setUserReview(userReview || null)
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()

    if (!newReview.title.trim() || !newReview.content.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch(`/api/stories/${storySlug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
      })

      const data = await response.json()

      if (response.ok) {
        setUserReview(data.review)
        setRatingStats(data.rating)
        setShowWriteReview(false)
        setNewReview({ rating: 5, title: '', content: '' })
        loadReviews() // Reload to get updated list
      } else {
        alert(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    }
  }

  const deleteReview = async () => {
    if (!confirm('Are you sure you want to delete your review?')) {
      return
    }

    try {
      const response = await fetch(`/api/stories/${storySlug}/reviews`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUserReview(null)
        loadReviews()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const markHelpful = async (reviewId, isHelpful) => {
    try {
      const response = await fetch(`/api/stories/${storySlug}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isHelpful })
      })

      if (response.ok) {
        const data = await response.json()

        // Update the review in the list
        setReviews(prev => prev.map(review =>
          review._id === reviewId
            ? {
                ...review,
                helpfulCount: data.helpfulCount,
                unhelpfulCount: data.unhelpfulCount
              }
            : review
        ))
      }
    } catch (error) {
      console.error('Error marking review helpful:', error)
    }
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 30) return `${days} days ago`
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`
  }

  return (
    <div className={className}>
      {/* Rating Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Reader Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{ratingStats.average.toFixed(1)}</div>
              <StarDisplay rating={ratingStats.average} count={ratingStats.count} size="large" />
              <p className="text-sm text-muted-foreground mt-2">
                Based on {ratingStats.count} {ratingStats.count === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingStats.distribution?.[star] || 0
                const percentage = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0

                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{star} ★</span>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Write Review Button */}
          {session && !userReview && (
            <div className="mt-6 pt-6 border-t">
              <Button onClick={() => setShowWriteReview(true)} className="w-full">
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </div>
          )}

          {/* User's Existing Review */}
          {userReview && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Your Review</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowWriteReview(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteReview} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Review
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <StarDisplay rating={userReview.rating} size="small" />
                <h5 className="font-medium mt-2">{userReview.title}</h5>
                <p className="text-sm text-muted-foreground mt-1">{userReview.content}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review List Controls */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          All Reviews ({reviews.length})
        </h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {sortBy === 'newest' && 'Newest First'}
              {sortBy === 'oldest' && 'Oldest First'}
              {sortBy === 'rating' && 'Highest Rated'}
              {sortBy === 'helpful' && 'Most Helpful'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
              Oldest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('rating')}>
              Highest Rated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('helpful')}>
              Most Helpful
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your thoughts about this story!
            </p>
            {session && (
              <Button onClick={() => setShowWriteReview(true)}>
                <Star className="h-4 w-4 mr-2" />
                Write the First Review
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.user.avatar} alt={review.user.name} />
                    <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link
                          href={`/profile/${review.user.username}`}
                          className="font-medium hover:underline"
                        >
                          {review.user.name}
                        </Link>
                        <span className="text-sm text-muted-foreground ml-2">
                          {getTimeAgo(review.createdAt)}
                        </span>
                      </div>

                      {session && review.user._id !== session.user.id && (
                        <Button variant="ghost" size="sm">
                          <Flag className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <StarDisplay rating={review.rating} size="small" className="mb-3" />

                    <h4 className="font-medium mb-2">{review.title}</h4>
                    <p className="text-foreground leading-relaxed mb-4">
                      {review.content}
                    </p>

                    {/* Review Actions */}
                    <div className="flex items-center gap-4 text-sm">
                      {session && review.user._id !== session.user.id && (
                        <>
                          <button
                            onClick={() => markHelpful(review._id, true)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-green-600 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Helpful ({review.helpfulCount || 0})
                          </button>
                          <button
                            onClick={() => markHelpful(review._id, false)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Not Helpful ({review.unhelpfulCount || 0})
                          </button>
                        </>
                      )}

                      {!session && (
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {review.helpfulCount || 0} helpful
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-4 w-4" />
                            {review.unhelpfulCount || 0} not helpful
                          </span>
                        </div>
                      )}
                    </div>

                    {review.updatedAt && new Date(review.updatedAt) > new Date(review.createdAt) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Edited {getTimeAgo(review.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Write Review Dialog */}
      <Dialog open={showWriteReview} onOpenChange={setShowWriteReview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {userReview ? 'Edit Your Review' : 'Write a Review'}
            </DialogTitle>
            <DialogDescription>
              Share your thoughts about this story to help other readers
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitReview} className="space-y-4">
            <div className="space-y-2">
              <Label>Your Rating</Label>
              <StarRating
                rating={newReview.rating}
                onChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                size="large"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Review Title</Label>
              <Input
                id="review-title"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your review..."
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                {newReview.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">Your Review</Label>
              <Textarea
                id="review-content"
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What did you think about this story? Share your thoughts without spoilers..."
                maxLength={2000}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                {newReview.content.length}/2000 characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWriteReview(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {userReview ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StoryReviews