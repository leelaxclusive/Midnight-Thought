import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import Chapter from '@/models/Chapter'

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

    // Get recent activities for the user
    // This could include likes, comments, follows, etc.
    // For now, we'll get recent interactions with the user's stories
    const userStories = await Story.find({
      'author.email': session.user.email
    }).select('_id title slug')

    // Get recent likes on user's stories
    const recentLikes = await Story.aggregate([
      {
        $match: {
          'author.email': session.user.email,
          'likes.0': { $exists: true }
        }
      },
      {
        $unwind: '$likes'
      },
      {
        $sort: { 'likes.createdAt': -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: 'likes.user',
          foreignField: '_id',
          as: 'likeUser'
        }
      },
      {
        $project: {
          type: { $literal: 'like' },
          user: { $arrayElemAt: ['$likeUser.name', 0] },
          story: '$title',
          storySlug: '$slug',
          time: '$likes.createdAt'
        }
      }
    ])

    // Get recent comments on user's stories
    const recentComments = await Story.aggregate([
      {
        $match: {
          'author.email': session.user.email,
          'comments.0': { $exists: true }
        }
      },
      {
        $unwind: '$comments'
      },
      {
        $sort: { 'comments.createdAt': -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.user',
          foreignField: '_id',
          as: 'commentUser'
        }
      },
      {
        $project: {
          type: { $literal: 'comment' },
          user: { $arrayElemAt: ['$commentUser.name', 0] },
          story: '$title',
          storySlug: '$slug',
          content: '$comments.content',
          time: '$comments.createdAt'
        }
      }
    ])

    // Combine and sort all activities
    const allActivities = [...recentLikes, ...recentComments]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20)

    return NextResponse.json({
      activities: allActivities
    })

  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}