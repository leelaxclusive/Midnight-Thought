import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Story from '@/models/Story'
import Chapter from '@/models/Chapter'

// GET /api/user/currently-reading - Get user's currently reading stories
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
        path: 'readingProgress.story',
        populate: {
          path: 'author',
          select: 'name username avatar'
        }
      })
      .populate('readingProgress.lastChapter')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Filter out completed stories and stories that don't exist
    const currentlyReading = user.readingProgress
      .filter(progress =>
        progress.story &&
        !progress.isCompleted &&
        progress.story.status !== 'draft'
      )
      .map(progress => ({
        id: progress.story._id,
        title: progress.story.title,
        slug: progress.story.slug,
        author: progress.story.author,
        genre: progress.story.genre,
        cover: progress.story.cover,
        description: progress.story.description,
        currentChapter: progress.chapterNumber,
        totalChapters: progress.story.chapters?.length || 0,
        progress: progress.progress || 0,
        lastRead: progress.lastRead,
        scrollPosition: progress.scrollPosition || 0,
        totalTimeRead: progress.totalTimeRead || 0
      }))
      .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))

    return NextResponse.json({
      currentlyReading,
      count: currentlyReading.length
    })

  } catch (error) {
    console.error('Error fetching currently reading:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currently reading stories' },
      { status: 500 }
    )
  }
}

// POST /api/user/currently-reading - Add or update reading progress
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
    const { storySlug, chapterNumber, scrollPosition = 0, timeSpent = 0 } = body

    if (!storySlug || !chapterNumber) {
      return NextResponse.json(
        { error: 'Story slug and chapter number are required' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find the story and chapter
    const story = await Story.findOne({ slug: storySlug })
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const chapter = await Chapter.findOne({
      story: story._id,
      chapterNumber: parseInt(chapterNumber)
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
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

    // Update reading progress
    const updatedUser = await user.updateReadingProgress(
      story._id,
      chapter._id,
      parseInt(chapterNumber),
      scrollPosition,
      timeSpent
    )

    // Calculate progress percentage
    const totalChapters = await Chapter.countDocuments({
      story: story._id,
      status: 'published'
    })

    const progress = Math.round((chapterNumber / totalChapters) * 100)

    // Update progress in the reading progress entry
    const progressEntry = updatedUser.readingProgress.find(
      p => p.story.toString() === story._id.toString()
    )

    if (progressEntry) {
      progressEntry.progress = progress
      if (progress >= 100) {
        progressEntry.isCompleted = true

        // Add to reading history if not already there
        const existingHistory = user.readingHistory.find(
          h => h.story.toString() === story._id.toString()
        )

        if (!existingHistory) {
          user.readingHistory.push({
            story: story._id,
            completedAt: new Date()
          })
        }
      }

      await updatedUser.save()
    }

    return NextResponse.json({
      message: 'Reading progress updated',
      progress: {
        storyId: story._id,
        chapterNumber,
        progress,
        isCompleted: progress >= 100
      }
    })

  } catch (error) {
    console.error('Error updating reading progress:', error)
    return NextResponse.json(
      { error: 'Failed to update reading progress' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/currently-reading - Remove story from currently reading
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

    // Remove from reading progress
    user.readingProgress = user.readingProgress.filter(
      progress => progress.story.toString() !== storyId
    )

    await user.save()

    return NextResponse.json({
      message: 'Story removed from currently reading'
    })

  } catch (error) {
    console.error('Error removing from currently reading:', error)
    return NextResponse.json(
      { error: 'Failed to remove story from currently reading' },
      { status: 500 }
    )
  }
}