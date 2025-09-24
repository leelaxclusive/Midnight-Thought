import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import Story from '@/models/Story'
import User from '@/models/User'

// POST /api/stories/[slug]/chapters/[chapterNumber]/analytics - Start reading session
export async function POST(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const resolvedParams = await params
    const { slug, chapterNumber } = resolvedParams
    const { action, sessionId } = await request.json()

    if (action !== 'start' || !sessionId) {
      return NextResponse.json(
        { error: 'Invalid action or missing sessionId' },
        { status: 400 }
      )
    }

    // Find the story and chapter
    const story = await Story.findOne({ slug })
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

    // Find the user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Start reading session using the model method
    await chapter.startReadingSession(user._id, sessionId)

    // Increment view count
    chapter.views = (chapter.views || 0) + 1
    await chapter.save()

    return NextResponse.json({
      message: 'Reading session started',
      sessionId
    })

  } catch (error) {
    console.error('Start reading session error:', error)
    return NextResponse.json(
      { error: 'Failed to start reading session' },
      { status: 500 }
    )
  }
}

// PUT /api/stories/[slug]/chapters/[chapterNumber]/analytics - Update reading session
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const resolvedParams = await params
    const { slug, chapterNumber } = resolvedParams
    const { action, sessionId, timeSpent, scrollProgress, completed } = await request.json()

    if (action !== 'update' || !sessionId) {
      return NextResponse.json(
        { error: 'Invalid action or missing sessionId' },
        { status: 400 }
      )
    }

    // Find the story and chapter
    const story = await Story.findOne({ slug })
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

    // Update reading session using the model method
    await chapter.updateReadingSession(sessionId, timeSpent, scrollProgress, completed)

    return NextResponse.json({
      message: 'Reading session updated'
    })

  } catch (error) {
    console.error('Update reading session error:', error)
    return NextResponse.json(
      { error: 'Failed to update reading session' },
      { status: 500 }
    )
  }
}

// GET /api/stories/[slug]/chapters/[chapterNumber]/analytics - Get chapter analytics
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const resolvedParams = await params
    const { slug, chapterNumber } = resolvedParams
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, all

    // Find the story and chapter
    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const chapter = await Chapter.findOne({
      story: story._id,
      chapterNumber: parseInt(chapterNumber)
    }).populate('analytics.readingSessions.userId', 'name username')

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Calculate period filter
    let dateFilter = null
    const now = new Date()

    switch (period) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        dateFilter = null
    }

    // Filter sessions by period
    let sessions = chapter.analytics?.readingSessions || []
    if (dateFilter) {
      sessions = sessions.filter(session =>
        session.createdAt && new Date(session.createdAt) >= dateFilter
      )
    }

    // Calculate analytics for the period
    const completedSessions = sessions.filter(s => s.completed)
    const totalReadTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
    const uniqueReaders = new Set(sessions.map(s => s.userId?.toString())).size

    const analytics = {
      totalViews: chapter.views || 0,
      totalReadTime,
      averageReadTime: sessions.length > 0 ? totalReadTime / sessions.length : 0,
      completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      uniqueReaders,
      sessionsCount: sessions.length,
      period,

      // Daily breakdown for charts
      dailyStats: getDailyStats(sessions, dateFilter),

      // Reading completion funnel
      completionFunnel: {
        started: sessions.length,
        reached25: sessions.filter(s => s.scrollProgress >= 25).length,
        reached50: sessions.filter(s => s.scrollProgress >= 50).length,
        reached75: sessions.filter(s => s.scrollProgress >= 75).length,
        completed: completedSessions.length
      }
    }

    return NextResponse.json({
      analytics,
      chapter: {
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        wordCount: chapter.wordCount,
        readingTime: chapter.readingTime
      }
    })

  } catch (error) {
    console.error('Get chapter analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get chapter analytics' },
      { status: 500 }
    )
  }
}

function getDailyStats(sessions, startDate) {
  const stats = {}
  const now = new Date()
  const start = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Initialize daily stats
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    stats[dateKey] = {
      date: dateKey,
      sessions: 0,
      totalTime: 0,
      completions: 0,
      uniqueReaders: new Set()
    }
  }

  // Aggregate session data by day
  sessions.forEach(session => {
    if (!session.createdAt) return

    const dateKey = new Date(session.createdAt).toISOString().split('T')[0]
    if (stats[dateKey]) {
      stats[dateKey].sessions++
      stats[dateKey].totalTime += session.timeSpent || 0
      if (session.completed) stats[dateKey].completions++
      if (session.userId) stats[dateKey].uniqueReaders.add(session.userId.toString())
    }
  })

  // Convert sets to counts
  return Object.values(stats).map(day => ({
    ...day,
    uniqueReaders: day.uniqueReaders.size
  }))
}