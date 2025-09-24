import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import { cachedPublicAPI } from '@/lib/middleware'
import { CacheKeys, CacheTTL } from '@/lib/cache'
import { withQueryPerformance } from '@/lib/performance'

async function handleTrending(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 6

    // Calculate trending score based on recent engagement
    // Formula: (views * 0.1) + (likes * 2) + (comments * 3) + (rating * 10) + recency bonus
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Add timeout wrapper to prevent hanging queries
    const queryWithTimeout = async (queryFn, timeoutMs = 10000) => {
      return Promise.race([
        queryFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
        )
      ])
    }

    const trendingStories = await withQueryPerformance('trending-stories', () =>
      queryWithTimeout(() => Story.aggregate([
      {
        $match: {
          status: { $in: ['ongoing', 'completed'] },
          visibility: 'public',
          updatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: 'story',
          as: 'chapters'
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$authorData', 0] },
          chapterCount: { $size: '$chapters' },
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          // Calculate trending score
          trendingScore: {
            $add: [
              { $multiply: ['$views', 0.1] },
              { $multiply: [{ $size: '$likes' }, 2] },
              { $multiply: [{ $size: '$comments' }, 3] },
              { $multiply: ['$rating.average', 10] },
              // Recency bonus: more recent = higher score
              {
                $divide: [
                  { $subtract: [new Date(), '$updatedAt'] },
                  1000 * 60 * 60 * 24 // Convert to days and invert
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          title: 1,
          slug: 1,
          description: 1,
          genre: 1,
          tags: 1,
          status: 1,
          views: 1,
          likesCount: 1,
          commentsCount: 1,
          chapterCount: 1,
          rating: 1,
          trendingScore: 1,
          updatedAt: 1,
          createdAt: 1,
          'author._id': 1,
          'author.name': 1,
          'author.username': 1,
          'author.avatar': 1
        }
      },
      {
        $sort: { trendingScore: -1 }
      },
      {
        $limit: limit
      }
    ])))

    // Format the response
    const formattedStories = trendingStories.map((story, index) => ({
      id: story._id,
      title: story.title,
      slug: story.slug,
      description: story.description,
      author: story.author ? {
        name: story.author.name || 'Unknown Author',
        username: story.author.username || 'unknown',
        avatar: story.author.avatar || ''
      } : {
        name: 'Unknown Author',
        username: 'unknown',
        avatar: ''
      },
      genre: story.genre || 'General',
      tags: story.tags || [],
      status: story.status,
      views: story.views || 0,
      likes: story.likesCount,
      comments: story.commentsCount,
      chapters: story.chapterCount,
      rating: story.rating?.average || 0,
      lastUpdated: story.updatedAt,
      trendingRank: index + 1,
      isHot: index === 0 // Mark the top story as "hot"
    }))

    return NextResponse.json({
      stories: formattedStories,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching trending stories:', error)

    // Return a proper error response with fallback data
    return NextResponse.json(
      {
        stories: [],
        error: 'Failed to fetch trending stories',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Export with caching and performance monitoring (fixed caching issue)
export const GET = cachedPublicAPI(
  (searchParams) => CacheKeys.HOME_TRENDING(searchParams.get('limit') || 6),
  CacheTTL.MEDIUM
)(handleTrending)