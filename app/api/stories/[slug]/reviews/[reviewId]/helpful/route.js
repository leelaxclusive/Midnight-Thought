import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'

// POST /api/stories/[slug]/reviews/[reviewId]/helpful - Mark review as helpful/unhelpful
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

    const { slug, reviewId } = params
    const { isHelpful } = await request.json()

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'isHelpful must be a boolean value' },
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

    const review = story.reviews.id(reviewId)
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if user is trying to mark their own review as helpful
    if (review.user.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot mark your own review as helpful' },
        { status: 400 }
      )
    }

    await story.markReviewHelpful(reviewId, user._id, isHelpful)

    // Get updated review stats
    const updatedStory = await Story.findById(story._id)
    const updatedReview = updatedStory.reviews.id(reviewId)

    const helpfulCount = updatedReview.helpful?.filter(h => h.isHelpful).length || 0
    const unhelpfulCount = updatedReview.helpful?.filter(h => !h.isHelpful).length || 0

    return NextResponse.json({
      message: `Review marked as ${isHelpful ? 'helpful' : 'unhelpful'}`,
      helpfulCount,
      unhelpfulCount,
      userVote: isHelpful
    })

  } catch (error) {
    console.error('Mark review helpful error:', error)
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    )
  }
}

// DELETE /api/stories/[slug]/reviews/[reviewId]/helpful - Remove helpfulness vote
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

    const { slug, reviewId } = params

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

    const review = story.reviews.id(reviewId)
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Remove user's vote
    review.helpful = review.helpful.filter(
      h => h.user.toString() !== user._id.toString()
    )

    await story.save()

    // Get updated stats
    const helpfulCount = review.helpful?.filter(h => h.isHelpful).length || 0
    const unhelpfulCount = review.helpful?.filter(h => !h.isHelpful).length || 0

    return NextResponse.json({
      message: 'Helpfulness vote removed',
      helpfulCount,
      unhelpfulCount,
      userVote: null
    })

  } catch (error) {
    console.error('Remove helpful vote error:', error)
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    )
  }
}