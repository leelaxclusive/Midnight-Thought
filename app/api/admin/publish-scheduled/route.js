import { NextResponse } from 'next/server'
import { publishScheduledChapters } from '@/lib/scheduled-publisher'

export async function POST(request) {
  try {
    // Simple API key authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.CRON_API_KEY || 'your-secret-cron-key'

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await publishScheduledChapters()

    if (result.success) {
      return NextResponse.json({
        success: true,
        published: result.published,
        message: result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in scheduled publisher API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Allow GET for manual testing
export async function GET(request) {
  try {
    // Check if request is from admin (you can implement proper admin auth here)
    const result = await publishScheduledChapters()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in scheduled publisher API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}