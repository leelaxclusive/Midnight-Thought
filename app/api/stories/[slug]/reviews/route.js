import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'
import { sanitizeForStorage } from '@/lib/sanitize'

// GET /api/stories/[slug]/reviews - Get all reviews for a story
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const { slug } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, oldest, rating, helpful

    const story = await Story.findOne({ slug })
      .populate('reviews.user', 'name username avatar')
      .lean()

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    let reviews = story.reviews || []

    // Sort reviews
    switch (sortBy) {
      case 'newest':
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'oldest':
        reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case 'rating':
        reviews.sort((a, b) => b.rating - a.rating)
        break
      case 'helpful':
        reviews.sort((a, b) => {
          const helpfulA = a.helpful?.filter(h => h.isHelpful).length || 0
          const helpfulB = b.helpful?.filter(h => h.isHelpful).length || 0
          return helpfulB - helpfulA
        })
        break
    }

    // Add helpful count to each review
    reviews = reviews.map(review => ({
      ...review,
      helpfulCount: review.helpful?.filter(h => h.isHelpful).length || 0,
      unhelpfulCount: review.helpful?.filter(h => !h.isHelpful).length || 0
    }))

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedReviews = reviews.slice(startIndex, endIndex)

    return NextResponse.json({
      reviews: paginatedReviews,
      pagination: {
        current: page,
        total: Math.ceil(reviews.length / limit),
        limit,
        totalReviews: reviews.length
      },
      rating: story.rating
    })

  } catch (error) {
    console.error('Get story reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/stories/[slug]/reviews - Add or update a review
export async function POST(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { slug } = params
    const { rating, title, content } = await request.json()

    // Validation
    if (!rating || !title || !content) {
      return NextResponse.json(
        { error: 'Rating, title, and content are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Review title cannot exceed 100 characters' },
        { status: 400 }
      )
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Review content cannot exceed 2000 characters' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Check if user is trying to review their own story
    if (story.author.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot review your own story' },
        { status: 400 }
      )
    }

    // Add or update review
    await story.addReview(
      user._id,
      parseInt(rating),
      sanitizeForStorage(title.trim(), 'comments'),
      sanitizeForStorage(content.trim(), 'comments')
    )

    // Get updated story with populated reviews
    const updatedStory = await Story.findById(story._id)
      .populate('reviews.user', 'name username avatar')

    const userReview = updatedStory.getUserReview(user._id)

    return NextResponse.json({
      message: 'Review saved successfully',
      review: userReview,
      rating: updatedStory.rating
    })

  } catch (error) {
    console.error('Add/update review error:', error)
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    )
  }
}

// DELETE /api/stories/[slug]/reviews - Delete user's review
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { slug } = params

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const success = await story.removeReview(user._id)

    if (!success) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Get updated rating stats
    const updatedStory = await Story.findById(story._id)

    return NextResponse.json({
      message: 'Review deleted successfully',
      rating: updatedStory.rating
    })

  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}