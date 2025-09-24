import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Story from '@/models/Story'
import Chapter from '@/models/Chapter'

// GET /api/user/reading-progress - Get user's reading progress
export async function GET(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 20
    const storyId = searchParams.get('storyId')

    const user = await User.findOne({ email: session.user.email })
      .populate({
        path: 'readingProgress.story',
        select: 'title slug author genre status description chaptersCount',
        populate: {
          path: 'author',
          select: 'name username'
        }
      })
      .populate('readingProgress.lastChapter', 'title chapterNumber')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let readingProgress = user.readingProgress

    // Filter by specific story if requested
    if (storyId) {
      readingProgress = readingProgress.filter(
        progress => progress.story && progress.story._id.toString() === storyId
      )
    }

    // Sort by last read date (most recent first)
    readingProgress.sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))

    // Limit results
    readingProgress = readingProgress.slice(0, limit)

    // Calculate progress percentage for each story
    const progressWithStats = await Promise.all(
      readingProgress.map(async (progress) => {
        if (!progress.story) return progress

        // Get total chapters for progress calculation
        const totalChapters = await Chapter.countDocuments({
          story: progress.story._id,
          status: 'published'
        })

        const progressPercentage = totalChapters > 0 ?
          Math.round((progress.chapterNumber / totalChapters) * 100) : 0

        return {
          ...progress.toObject(),
          progressPercentage,
          totalChapters
        }
      })
    )

    return NextResponse.json({
      readingProgress: progressWithStats,
      total: user.readingProgress.length
    })

  } catch (error) {
    console.error('Get reading progress error:', error)
    return NextResponse.json(
      { error: 'Failed to get reading progress' },
      { status: 500 }
    )
  }
}

// POST /api/user/reading-progress - Update reading progress
export async function POST(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { storyId, chapterId, chapterNumber, scrollPosition, timeSpent } = await request.json()

    if (!storyId || !chapterId || !chapterNumber) {
      return NextResponse.json(
        { error: 'Story ID, chapter ID, and chapter number are required' },
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

    // Verify story and chapter exist
    const story = await Story.findById(storyId)
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const chapter = await Chapter.findById(chapterId)
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Update reading progress
    await user.updateReadingProgress(
      storyId,
      chapterId,
      chapterNumber,
      scrollPosition || 0,
      timeSpent || 0
    )

    // Get updated progress
    const updatedUser = await User.findById(user._id)
    const progress = updatedUser.getReadingProgress(storyId)

    return NextResponse.json({
      message: 'Reading progress updated successfully',
      progress
    })

  } catch (error) {
    console.error('Update reading progress error:', error)
    return NextResponse.json(
      { error: 'Failed to update reading progress' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/reading-progress - Remove reading progress for a story
export async function DELETE(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      )
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { readingProgress: { story: storyId } } },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Reading progress removed successfully'
    })

  } catch (error) {
    console.error('Remove reading progress error:', error)
    return NextResponse.json(
      { error: 'Failed to remove reading progress' },
      { status: 500 }
    )
  }
}