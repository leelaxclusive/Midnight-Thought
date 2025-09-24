import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Story from '@/models/Story'

// GET /api/users/[username] - Get user profile by username
export async function GET(request, { params }) {
  try {
    await dbConnect()
    const { username } = await params

    // Find user by username
    const user = await User.findOne({ username })
      .select('-email -password') // Exclude sensitive information
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's stories with stats
    const stories = await Story.find({
      author: user._id,
      visibility: { $in: ['public', 'unlisted'] } // Only show public and unlisted stories
    })
      .select('title slug description genre status cover chapters views likes comments saves createdAt updatedAt featured tags')
      .populate('chapters', 'chapterNumber')
      .lean()

    // Calculate user statistics
    const totalViews = stories.reduce((sum, story) => sum + (story.views || 0), 0)
    const totalLikes = stories.reduce((sum, story) => sum + (story.likes?.length || 0), 0)
    const totalSaves = stories.reduce((sum, story) => sum + (story.saves?.length || 0), 0)
    const totalComments = stories.reduce((sum, story) => sum + (story.comments?.length || 0), 0)
    const totalStories = stories.length
    const totalChapters = stories.reduce((sum, story) => sum + (story.chapters?.length || 0), 0)

    // Calculate monthly stats (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentStories = stories.filter(story => new Date(story.updatedAt) >= thirtyDaysAgo)
    const monthlyViews = recentStories.reduce((sum, story) => sum + (story.views || 0), 0)
    const monthlyLikes = recentStories.reduce((sum, story) => sum + (story.likes?.length || 0), 0)

    // Find most popular genre
    const genreCounts = stories.reduce((acc, story) => {
      acc[story.genre] = (acc[story.genre] || 0) + 1
      return acc
    }, {})
    const mostPopularGenre = Object.keys(genreCounts).reduce((a, b) =>
      genreCounts[a] > genreCounts[b] ? a : b, 'Fantasy'
    )

    // Calculate total word count (approximate)
    const estimatedWordsPerChapter = 2000 // Average words per chapter
    const totalWords = totalChapters * estimatedWordsPerChapter
    const readingTime = Math.ceil(totalWords / 200) // Reading time in minutes

    // Format stories data
    const formattedStories = stories.map(story => ({
      ...story,
      chapters: story.chapters?.length || 0,
      likes: story.likes?.length || 0,
      saves: story.saves?.length || 0,
      comments: story.comments?.length || 0
    }))

    // Prepare user stats
    const stats = {
      monthlyViews,
      monthlyLikes,
      totalWords,
      readingTime,
      mostPopularGenre
    }

    // Prepare user profile data
    const profileData = {
      ...user,
      totalStories,
      totalViews,
      totalLikes,
      totalSaves,
      totalComments,
      totalChapters,
      joinedAt: user.createdAt,
      // Add some basic achievements
      achievements: []
    }

    // Add achievements based on stats
    if (totalStories >= 3) {
      profileData.achievements.push({
        id: 1,
        name: "Prolific Writer",
        description: "Published 3+ stories",
        icon: "📚"
      })
    }

    if (totalLikes >= 100) {
      profileData.achievements.push({
        id: 2,
        name: "Community Favorite",
        description: "100+ total likes",
        icon: "❤️"
      })
    }

    if (stories.some(story => story.featured)) {
      profileData.achievements.push({
        id: 3,
        name: "Featured Author",
        description: "Has a featured story",
        icon: "🔥"
      })
    }

    return NextResponse.json({
      user: profileData,
      stories: formattedStories,
      stats
    })

  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}