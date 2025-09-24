import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 6

    // Get completed stories sorted by rating and completion date
    const completedStories = await Story.aggregate([
      {
        $match: {
          status: 'completed',
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
            { $match: { status: 'published' } }
          ]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$authorData', 0] },
          chapterCount: { $size: '$chapters' },
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          // Calculate completion score: rating + engagement
          completionScore: {
            $add: [
              { $multiply: ['$rating.average', 20] }, // Rating weight
              { $multiply: [{ $size: '$likes' }, 0.5] },
              { $multiply: [{ $size: '$comments' }, 1] },
              { $multiply: ['$views', 0.01] }
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
          completionScore: 1,
          updatedAt: 1,
          createdAt: 1,
          completedAt: 1,
          'author._id': 1,
          'author.name': 1,
          'author.username': 1,
          'author.avatar': 1
        }
      },
      {
        $sort: { completionScore: -1, completedAt: -1 }
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

      if (days === 0) return 'Today'
      if (days === 1) return '1 day ago'
      if (days < 30) return `${days} days ago`
      if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
      return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`
    }

    // Format the response
    const formattedStories = completedStories.map(story => ({
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
      completedAt: story.completedAt ? getTimeAgo(story.completedAt) : getTimeAgo(story.updatedAt),
      isCompleted: true
    }))

    return NextResponse.json({
      stories: formattedStories,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching completed stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed stories' },
      { status: 500 }
    )
  }
}