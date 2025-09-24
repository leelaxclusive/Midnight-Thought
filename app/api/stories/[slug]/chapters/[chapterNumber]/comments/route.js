import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import Story from '@/models/Story'
import User from '@/models/User'
import { sanitizeForStorage } from '@/lib/sanitize'

// GET /api/stories/[slug]/chapters/[chapterNumber]/comments - Get all comments for a chapter
export async function GET(request, { params }) {
  try {
    await dbConnect()
    const { slug, chapterNumber } = await params

    // Find the story first
    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const chapter = await Chapter.findOne({
      story: story._id,
      chapterNumber: parseInt(chapterNumber)
    })
      .populate('comments.user', 'name username avatar')
      .populate('comments.replies.user', 'name username avatar')
      .lean()

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json({
      comments: chapter.comments || []
    })

  } catch (error) {
    console.error('Get chapter comments error:', error)
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
    const { slug, chapterNumber } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the story first
    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const chapter = await Chapter.findOne({
      story: story._id,
      chapterNumber: parseInt(chapterNumber)
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const newComment = {
      user: user._id,
      content: sanitizeForStorage(content.trim(), 'comments'),
      createdAt: new Date(),
      likes: [],
      replies: []
    }

    chapter.comments.push(newComment)
    await chapter.save()

    const populatedChapter = await Chapter.findById(chapter._id)
      .populate('comments.user', 'name username avatar')
      .populate('comments.replies.user', 'name username avatar')

    const addedComment = populatedChapter.comments[populatedChapter.comments.length - 1]

    return NextResponse.json({ 
      message: 'Comment added successfully',
      comment: addedComment
    })

  } catch (error) {
    console.error('Add chapter comment error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}