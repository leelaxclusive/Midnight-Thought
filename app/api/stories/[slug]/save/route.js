import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'

// GET /api/stories/[slug]/save - Check if user has saved the story
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ saved: false })
    }

    await dbConnect()
    const { slug } = await params

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ saved: false })
    }

    const isSaved = story.saves.some(save => save.user?.toString() === user._id.toString())

    return NextResponse.json({
      saved: isSaved,
      savesCount: story.saves.length
    })

  } catch (error) {
    console.error('Check save status error:', error)
    return NextResponse.json({ saved: false })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    const { slug } = await params

    const story = await Story.findOne({ slug })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingSave = story.saves.find(save => save.user?.toString() === user._id.toString())
    
    if (existingSave) {
      story.saves = story.saves.filter(save => save.user?.toString() !== user._id.toString())
      user.savedStories = user.savedStories.filter(id => id.toString() !== story._id.toString())
    } else {
      story.saves.push({ user: user._id, createdAt: new Date() })
      user.savedStories.push(story._id)
    }

    await story.save()
    await user.save()

    return NextResponse.json({ 
      saved: !existingSave,
      savesCount: story.saves.length
    })

  } catch (error) {
    console.error('Save story error:', error)
    return NextResponse.json({ error: 'Failed to save story' }, { status: 500 })
  }
}