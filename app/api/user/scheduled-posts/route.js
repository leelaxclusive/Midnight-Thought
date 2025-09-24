import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import Story from '@/models/Story'

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

    // Get scheduled chapters for the user's stories
    const scheduledChapters = await Chapter.aggregate([
      {
        $lookup: {
          from: 'stories',
          localField: 'story',
          foreignField: '_id',
          as: 'storyData'
        }
      },
      {
        $unwind: '$storyData'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'storyData.author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      {
        $match: {
          status: 'scheduled',
          'authorData.email': session.user.email,
          scheduledFor: { $gt: new Date() }
        }
      },
      {
        $project: {
          title: 1,
          chapterNumber: 1,
          scheduledFor: 1,
          story: {
            title: '$storyData.title',
            slug: '$storyData.slug'
          }
        }
      },
      {
        $sort: { scheduledFor: 1 }
      }
    ])

    return NextResponse.json({
      posts: scheduledChapters
    })

  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}