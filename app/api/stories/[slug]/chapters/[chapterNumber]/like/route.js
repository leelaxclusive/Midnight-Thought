import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import Story from '@/models/Story'
import User from '@/models/User'

// GET /api/stories/[slug]/chapters/[chapterNumber]/like - Check if user has liked the chapter
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ liked: false })
    }

    await dbConnect()
    const { slug, chapterNumber } = await params

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ liked: false })
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

    const isLiked = chapter.likes.some(like => like.user?.toString() === user._id.toString())

    return NextResponse.json({
      liked: isLiked,
      likesCount: chapter.likes.length
    })

  } catch (error) {
    console.error('Check chapter like status error:', error)
    return NextResponse.json({ liked: false })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    const { slug, chapterNumber } = await params

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

    const existingLike = chapter.likes.find(like => like.user?.toString() === user._id.toString())
    
    if (existingLike) {
      chapter.likes = chapter.likes.filter(like => like.user?.toString() !== user._id.toString())
    } else {
      chapter.likes.push({ user: user._id, createdAt: new Date() })
    }

    await chapter.save()

    return NextResponse.json({ 
      liked: !existingLike,
      likesCount: chapter.likes.length
    })

  } catch (error) {
    console.error('Like chapter error:', error)
    return NextResponse.json({ error: 'Failed to like chapter' }, { status: 500 })
  }
}