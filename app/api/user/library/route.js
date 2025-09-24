import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .populate({
        path: 'savedStories',
        populate: {
          path: 'author',
          select: 'name username avatar'
        }
      })
      .populate({
        path: 'readingProgress.story',
        populate: {
          path: 'author',
          select: 'name username avatar'
        }
      })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      savedStories: user.savedStories || [],
      readingProgress: user.readingProgress || []
    })

  } catch (error) {
    console.error('Get user library error:', error)
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
  }
}