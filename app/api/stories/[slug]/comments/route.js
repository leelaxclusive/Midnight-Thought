import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'
import { sanitizeForStorage } from '@/lib/sanitize'

// GET /api/stories/[slug]/comments - Get all comments for a story
export async function GET(request, { params }) {
  try {
    await dbConnect()
    const { slug } = await params

    const story = await Story.findOne({ slug })
      .populate('comments.user', 'name username avatar')
      .populate('comments.replies.user', 'name username avatar')
      .lean()

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    return NextResponse.json({
      comments: story.comments || []
    })

  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    const { slug } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newComment = {
      user: user._id,
      content: sanitizeForStorage(content.trim(), 'comments'),
      createdAt: new Date(),
      likes: [],
      replies: []
    }

    story.comments.push(newComment)
    await story.save()

    const populatedStory = await Story.findById(story._id)
      .populate('comments.user', 'name username avatar')
      .populate('comments.replies.user', 'name username avatar')

    const addedComment = populatedStory.comments[populatedStory.comments.length - 1]

    return NextResponse.json({ 
      message: 'Comment added successfully',
      comment: addedComment
    })

  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}