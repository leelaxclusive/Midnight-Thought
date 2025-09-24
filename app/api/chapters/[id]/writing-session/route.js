import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import User from '@/models/User'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = params
    const {
      wordsWritten,
      duration,
      startWordCount,
      endWordCount,
      sessionType = 'writing'
    } = await request.json()

    const chapter = await Chapter.findById(id)
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    if (chapter.author.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Add writing session to chapter
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingSessionIndex = chapter.writingSessions.findIndex(
      s => s.date.getTime() === today.getTime()
    )

    if (existingSessionIndex >= 0) {
      // Update existing session
      chapter.writingSessions[existingSessionIndex].wordsWritten += wordsWritten
      chapter.writingSessions[existingSessionIndex].duration += duration
      chapter.writingSessions[existingSessionIndex].sessions += 1
    } else {
      // Create new session
      chapter.writingSessions.push({
        date: today,
        wordsWritten,
        duration,
        sessions: 1,
        startWordCount,
        endWordCount
      })
    }

    await chapter.save()

    // Update user writing streak and stats
    const user = await User.findById(session.user.id)
    if (user) {
      await user.updateWritingStreak()

      // Update daily goals progress
      const todayStats = chapter.writingSessions.find(
        s => s.date.getTime() === today.getTime()
      )

      const dailyProgress = {
        wordsToday: todayStats?.wordsWritten || 0,
        timeToday: todayStats?.duration || 0,
        dailyTarget: user.authorInfo.writingGoals.dailyWordTarget || 500,
        streak: user.authorInfo.writingGoals.currentStreak
      }

      return NextResponse.json({
        success: true,
        session: todayStats,
        progress: dailyProgress
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving writing session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = params

    const chapter = await Chapter.findById(id)
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    if (chapter.author.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get today's session
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySession = chapter.writingSessions.find(
      s => s.date.getTime() === today.getTime()
    )

    const user = await User.findById(session.user.id)

    return NextResponse.json({
      session: todaySession || {
        date: today,
        wordsWritten: 0,
        duration: 0,
        sessions: 0
      },
      dailyTarget: user?.authorInfo.writingGoals.dailyWordTarget || 500,
      currentStreak: user?.authorInfo.writingGoals.currentStreak || 0
    })

  } catch (error) {
    console.error('Error fetching writing session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}