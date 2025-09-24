import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import { publishScheduledChapters } from '@/lib/scheduled-publisher'

export async function GET(request) {
  try {
    await connectDB()

    const now = new Date()

    // Get all scheduled chapters for debugging
    const scheduledChapters = await Chapter.find({
      status: 'scheduled'
    }).populate('story author', 'title slug name')

    // Get chapters that should be published now
    const readyToPublish = scheduledChapters.filter(ch =>
      ch.scheduledPublishDate && ch.scheduledPublishDate <= now
    )

    return NextResponse.json({
      currentTime: now.toISOString(),
      totalScheduledChapters: scheduledChapters.length,
      readyToPublish: readyToPublish.length,
      scheduledChapters: scheduledChapters.map(ch => ({
        id: ch._id,
        title: ch.title,
        storyTitle: ch.story?.title,
        authorName: ch.author?.name,
        scheduledPublishDate: ch.scheduledPublishDate?.toISOString(),
        timezone: ch.timezone,
        shouldPublish: ch.scheduledPublishDate && ch.scheduledPublishDate <= now,
        timeDiff: ch.scheduledPublishDate ? now - ch.scheduledPublishDate : null
      }))
    })
  } catch (error) {
    console.error('Error fetching scheduled chapters:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Force run the publisher
    const result = await publishScheduledChapters()

    return NextResponse.json({
      success: true,
      publisherResult: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error running publisher:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}