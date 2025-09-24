import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Story from '@/models/Story'

// GET /api/user/saved-stories - Get user's saved stories
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .populate({
        path: 'savedStories',
        populate: {
          path: 'author',
          select: 'name username avatar'
        }
      })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Filter out null/deleted stories and format the data
    const savedStories = user.savedStories
      .filter(story => story && story.visibility === 'public')
      .map(story => ({
        id: story._id,
        title: story.title,
        slug: story.slug,
        author: story.author,
        genre: story.genre,
        cover: story.cover,
        description: story.description,
        status: story.status,
        views: story.views || 0,
        likes: story.likes?.length || 0,
        chaptersCount: story.chapters?.length || 0,
        rating: story.rating?.average || 0,
        tags: story.tags || [],
        createdAt: story.createdAt,
        updatedAt: story.updatedAt
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    return NextResponse.json({
      savedStories,
      count: savedStories.length
    })

  } catch (error) {
    console.error('Error fetching saved stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved stories' },
      { status: 500 }
    )
  }
}

// POST /api/user/saved-stories - Add story to saved stories
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { storyId } = body

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if story exists
    const story = await Story.findById(storyId)
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const alreadySaved = user.savedStories.some(
      id => id.toString() === storyId
    )

    if (alreadySaved) {
      return NextResponse.json(
        { message: 'Story already saved' },
        { status: 200 }
      )
    }

    // Add to user's saved stories
    user.savedStories.push(storyId)

    // Add to story's saves array
    const existingSave = story.saves.find(
      save => save.user?.toString() === user._id.toString()
    )

    if (!existingSave) {
      story.saves.push({ user: user._id, createdAt: new Date() })
    }

    await Promise.all([user.save(), story.save()])

    return NextResponse.json({
      message: 'Story saved successfully',
      saved: true
    })

  } catch (error) {
    console.error('Error saving story:', error)
    return NextResponse.json(
      { error: 'Failed to save story' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/saved-stories - Remove story from saved stories
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove from user's saved stories
    user.savedStories = user.savedStories.filter(
      id => id.toString() !== storyId
    )

    // Remove from story's saves array
    const story = await Story.findById(storyId)
    if (story) {
      story.saves = story.saves.filter(
        save => save.user?.toString() !== user._id.toString()
      )
      await story.save()
    }

    await user.save()

    return NextResponse.json({
      message: 'Story removed from saved stories',
      saved: false
    })

  } catch (error) {
    console.error('Error removing saved story:', error)
    return NextResponse.json(
      { error: 'Failed to remove saved story' },
      { status: 500 }
    )
  }
}