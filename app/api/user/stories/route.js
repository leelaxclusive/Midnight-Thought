import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'

// GET /api/user/stories - Get current user's stories
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Find the user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const stories = await Story.find({ author: user._id })
      .select('title slug description status chapters createdAt lastUpdated genre visibility views likes tags language')
      .populate('chapters', 'chapterNumber status')
      .sort({ createdAt: -1 })
      .lean()

    const storiesWithStats = stories.map(story => ({
      ...story,
      // Ensure all required fields have defaults
      title: story.title || '',
      description: story.description || '',
      genre: story.genre || 'Other',
      tags: story.tags || [],
      language: story.language || 'English',
      visibility: story.visibility || 'public',
      status: story.status || 'draft',
      // Stats
      chaptersCount: story.chapters?.length || 0,
      lastChapterNumber: Math.max(...(story.chapters?.map(ch => ch.chapterNumber) || [0]), 0),
      likesCount: story.likes?.length || 0
    }))

    return NextResponse.json({ stories: storiesWithStats })

  } catch (error) {
    console.error('Get user stories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}