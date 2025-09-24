import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import Chapter from '@/models/Chapter'
import User from '@/models/User'

export async function GET() {
  try {
    await dbConnect()

    // Run all queries in parallel for better performance
    const [
      totalStories,
      publishedStories,
      totalChapters,
      totalWriters,
      totalUsers,
      completedStories,
      ongoingStories
    ] = await Promise.all([
      Story.countDocuments(),
      Story.countDocuments({ status: { $in: ['ongoing', 'completed'] }, visibility: 'public' }),
      Chapter.countDocuments({ status: 'published' }),
      User.countDocuments({ role: { $in: ['author', 'admin'] } }),
      User.countDocuments(),
      Story.countDocuments({ status: 'completed' }),
      Story.countDocuments({ status: 'ongoing' })
    ])

    // Calculate total views across all published stories
    const viewsAggregation = await Story.aggregate([
      { $match: { status: { $in: ['ongoing', 'completed'] }, visibility: 'public' } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ])
    const totalViews = viewsAggregation[0]?.totalViews || 0

    // Calculate total likes across all published stories
    const likesAggregation = await Story.aggregate([
      { $match: { status: { $in: ['ongoing', 'completed'] }, visibility: 'public' } },
      { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
    ])
    const totalLikes = likesAggregation[0]?.totalLikes || 0

    // Get genre distribution
    const genreDistribution = await Story.aggregate([
      { $match: { status: { $in: ['ongoing', 'completed'] }, visibility: 'public', genre: { $exists: true, $ne: null } } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    const stats = {
      stories: {
        total: totalStories,
        published: publishedStories,
        completed: completedStories,
        ongoing: ongoingStories
      },
      chapters: {
        total: totalChapters
      },
      users: {
        total: totalUsers,
        writers: totalWriters,
        readers: totalUsers - totalWriters
      },
      engagement: {
        totalViews,
        totalLikes
      },
      genres: genreDistribution.map(genre => ({
        name: genre._id,
        count: genre.count
      }))
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching home stats:', error)

    // Return fallback stats structure
    return NextResponse.json(
      {
        stories: { total: 0, published: 0, completed: 0, ongoing: 0 },
        chapters: { total: 0 },
        users: { total: 0, writers: 0 },
        genres: [],
        error: 'Failed to fetch statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}