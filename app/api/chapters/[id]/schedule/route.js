import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import Story from '@/models/Story'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const resolvedParams = await params
    const { id } = resolvedParams
    const { scheduledDate, timezone } = await request.json()

    const chapter = await Chapter.findById(id).populate('story')
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    if (chapter.author.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate scheduled date is in the future
    const scheduleDate = new Date(scheduledDate)
    if (scheduleDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled date must be in the future' }, { status: 400 })
    }

    chapter.scheduledPublishDate = scheduleDate
    chapter.timezone = timezone
    chapter.status = 'scheduled'
    await chapter.save()

    return NextResponse.json({
      success: true,
      chapter: {
        id: chapter._id,
        scheduledPublishDate: chapter.scheduledPublishDate,
        timezone: chapter.timezone,
        status: chapter.status
      }
    })

  } catch (error) {
    console.error('Error scheduling chapter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const resolvedParams = await params
    const { id } = resolvedParams

    const chapter = await Chapter.findById(id)
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    if (chapter.author.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    chapter.scheduledPublishDate = null
    chapter.timezone = null
    chapter.status = 'draft'
    await chapter.save()

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}