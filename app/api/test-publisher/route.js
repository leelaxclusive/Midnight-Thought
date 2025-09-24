import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import { publishScheduledChapters } from '@/lib/scheduled-publisher'

export async function GET(request) {
  try {
    await connectDB()

    const now = new Date()
    console.log('Current time:', now.toISOString())

    // Get ALL chapters to see what we have
    const allChapters = await Chapter.find({}).select('title status scheduledPublishDate timezone createdAt')
    console.log('All chapters:', allChapters.map(ch => ({
      title: ch.title,
      status: ch.status,
      scheduledPublishDate: ch.scheduledPublishDate?.toISOString(),
      timezone: ch.timezone,
      createdAt: ch.createdAt?.toISOString()
    })))

    // Get specifically scheduled chapters
    const scheduledChapters = await Chapter.find({ status: 'scheduled' })
      .select('title scheduledPublishDate timezone')

    console.log('Scheduled chapters found:', scheduledChapters.length)

    // Get chapters that should be published
    const readyChapters = await Chapter.find({
      status: 'scheduled',
      scheduledPublishDate: { $lte: now }
    }).select('title scheduledPublishDate timezone')

    console.log('Ready to publish:', readyChapters.length)

    // Try running the publisher
    console.log('Running publisher...')
    const result = await publishScheduledChapters()
    console.log('Publisher result:', result)

    return NextResponse.json({
      currentTime: now.toISOString(),
      totalChapters: allChapters.length,
      scheduledChapters: scheduledChapters.length,
      readyToPublish: readyChapters.length,
      publisherResult: result,
      allChapters: allChapters.map(ch => ({
        title: ch.title,
        status: ch.status,
        scheduledPublishDate: ch.scheduledPublishDate?.toISOString(),
        timezone: ch.timezone,
        shouldPublish: ch.scheduledPublishDate && ch.scheduledPublishDate <= now
      })),
      scheduledDetails: scheduledChapters.map(ch => ({
        title: ch.title,
        scheduledPublishDate: ch.scheduledPublishDate?.toISOString(),
        timezone: ch.timezone,
        shouldPublish: ch.scheduledPublishDate && ch.scheduledPublishDate <= now,
        timeDiff: ch.scheduledPublishDate ? (now - ch.scheduledPublishDate) / 1000 : null
      }))
    })
  } catch (error) {
    console.error('Test publisher error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log('Manual publisher trigger')
    const result = await publishScheduledChapters()
    console.log('Manual publisher result:', result)

    return NextResponse.json({
      message: 'Publisher manually triggered',
      result: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Manual publisher error:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}