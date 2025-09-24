import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

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

    // Find the user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's reading history (completed stories)
    const readingHistory = await User.aggregate([
      { $match: { _id: user._id } },
      { $unwind: '$readingHistory' },
      {
        $lookup: {
          from: 'stories',
          localField: 'readingHistory.story',
          foreignField: '_id',
          as: 'story'
        }
      },
      { $unwind: '$story' },
      {
        $lookup: {
          from: 'users',
          localField: 'story.author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $addFields: {
          'story.author': { $arrayElemAt: ['$author', 0] }
        }
      },
      {
        $lookup: {
          from: 'chapters',
          localField: 'story._id',
          foreignField: 'story',
          as: 'story.chapters'
        }
      },
      {
        $project: {
          story: {
            _id: '$story._id',
            title: '$story.title',
            slug: '$story.slug',
            genre: '$story.genre',
            cover: '$story.cover',
            author: {
              name: '$story.author.name',
              username: '$story.author.username'
            },
            chapters: '$story.chapters'
          },
          rating: '$readingHistory.rating',
          completedAt: '$readingHistory.completedAt',
          review: '$readingHistory.review'
        }
      },
      { $sort: { completedAt: -1 } }
    ])

    return NextResponse.json({
      history: readingHistory
    })

  } catch (error) {
    console.error('Error fetching reading history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading history' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { storyId, rating, review } = await request.json()

    await dbConnect()

    // Find the user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Add or update reading history entry
    const existingHistoryIndex = user.readingHistory.findIndex(
      h => h.story.toString() === storyId
    )

    const historyEntry = {
      story: storyId,
      rating: rating || 0,
      review: review || '',
      completedAt: new Date()
    }

    if (existingHistoryIndex >= 0) {
      user.readingHistory[existingHistoryIndex] = historyEntry
    } else {
      user.readingHistory.push(historyEntry)
    }

    await user.save()

    return NextResponse.json({
      message: 'Reading history updated successfully'
    })

  } catch (error) {
    console.error('Error updating reading history:', error)
    return NextResponse.json(
      { error: 'Failed to update reading history' },
      { status: 500 }
    )
  }
}