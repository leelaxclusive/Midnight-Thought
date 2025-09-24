import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Chapter from '@/models/Chapter'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get writing sessions from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentChapters = await Chapter.find({
      author: session.user.id,
      updatedAt: { $gte: thirtyDaysAgo }
    }).sort({ updatedAt: -1 })

    // Calculate daily writing stats
    const dailyStats = {}
    recentChapters.forEach(chapter => {
      if (chapter.writingSessions && chapter.writingSessions.length > 0) {
        chapter.writingSessions.forEach(session => {
          const date = session.date.toISOString().split('T')[0]
          if (!dailyStats[date]) {
            dailyStats[date] = {
              date,
              wordsWritten: 0,
              timeSpent: 0,
              sessions: 0
            }
          }
          dailyStats[date].wordsWritten += session.wordsWritten || 0
          dailyStats[date].timeSpent += session.duration || 0
          dailyStats[date].sessions += 1
        })
      }
    })

    // Convert to array and sort by date
    const dailyStatsArray = Object.values(dailyStats).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    )

    // Calculate streaks
    const today = new Date().toISOString().split('T')[0]
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Check from today backwards
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayStats = dailyStats[dateStr]
      if (dayStats && dayStats.wordsWritten > 0) {
        if (i === 0 || currentStreak === i) {
          currentStreak = i + 1
        }
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Weekly goals progress
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weeklyStats = dailyStatsArray
      .filter(day => new Date(day.date) >= weekStart)
      .reduce((acc, day) => ({
        wordsWritten: acc.wordsWritten + day.wordsWritten,
        timeSpent: acc.timeSpent + day.timeSpent,
        sessions: acc.sessions + day.sessions
      }), { wordsWritten: 0, timeSpent: 0, sessions: 0 })

    return NextResponse.json({
      user: {
        writingGoals: user.authorInfo.writingGoals,
        stats: user.stats
      },
      streaks: {
        current: currentStreak,
        longest: longestStreak
      },
      daily: dailyStatsArray,
      weekly: weeklyStats,
      monthly: {
        wordsWritten: dailyStatsArray.reduce((sum, day) => sum + day.wordsWritten, 0),
        timeSpent: dailyStatsArray.reduce((sum, day) => sum + day.timeSpent, 0),
        sessions: dailyStatsArray.reduce((sum, day) => sum + day.sessions, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching writing stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { dailyWordTarget, monthlyChapterTarget } = await request.json()

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update writing goals
    user.authorInfo.writingGoals.dailyWordTarget = dailyWordTarget || 0
    user.authorInfo.writingGoals.monthlyChapterTarget = monthlyChapterTarget || 0

    await user.save()

    return NextResponse.json({
      success: true,
      writingGoals: user.authorInfo.writingGoals
    })

  } catch (error) {
    console.error('Error updating writing goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}