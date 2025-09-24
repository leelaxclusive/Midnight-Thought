import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'

// GET /api/stories/[slug]/like - Check if user has liked the story
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ liked: false })
    }

    await dbConnect()
    const { slug } = await params

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ liked: false })
    }

    const isLiked = story.likes.some(like => like.user?.toString() === user._id.toString())

    return NextResponse.json({
      liked: isLiked,
      likesCount: story.likes.length
    })

  } catch (error) {
    console.error('Check like status error:', error)
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
    const { slug } = await params

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingLike = story.likes.find(like => like.user?.toString() === user._id.toString())
    
    if (existingLike) {
      story.likes = story.likes.filter(like => like.user?.toString() !== user._id.toString())
    } else {
      story.likes.push({ user: user._id, createdAt: new Date() })
    }

    await story.save()

    return NextResponse.json({ 
      liked: !existingLike,
      likesCount: story.likes.length
    })

  } catch (error) {
    console.error('Like story error:', error)
    return NextResponse.json({ error: 'Failed to like story' }, { status: 500 })
  }
}