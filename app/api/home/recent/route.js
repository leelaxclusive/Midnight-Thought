import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 8

    // Get recently updated stories
    const recentStories = await Story.aggregate([
      {
        $match: {
          status: { $in: ['ongoing', 'completed'] },
          visibility: 'public'
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
          as: 'chapters',
          pipeline: [
            { $match: { status: 'published' } },
            { $sort: { chapterNumber: -1 } },
            { $limit: 1 }
          ]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$authorData', 0] },
          chapterCount: { $size: '$chapters' },
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          lastChapter: { $arrayElemAt: ['$chapters', 0] }
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
          updatedAt: 1,
          createdAt: 1,
          'author._id': 1,
          'author.name': 1,
          'author.username': 1,
          'author.avatar': 1,
          'lastChapter.title': 1,
          'lastChapter.publishedAt': 1
        }
      },
      {
        $sort: { updatedAt: -1 }
      },
      {
        $limit: limit
      }
    ])

    // Helper function to format time ago
    const getTimeAgo = (date) => {
      const now = new Date()
      const diff = now - new Date(date)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor(diff / (1000 * 60))

      if (days > 0) {
        if (days === 1) return '1 day ago'
        if (days < 7) return `${days} days ago`
        if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
        if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
        return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`
      }
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      return 'Just now'
    }

    // Format the response
    const formattedStories = recentStories.map(story => ({
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
      lastUpdated: getTimeAgo(story.updatedAt),
      lastUpdatedRaw: story.updatedAt,
      lastChapter: story.lastChapter?.title || null,
      isCompleted: story.status === 'completed'
    }))

    return NextResponse.json({
      stories: formattedStories,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching recent stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent stories' },
      { status: 500 }
    )
  }
}