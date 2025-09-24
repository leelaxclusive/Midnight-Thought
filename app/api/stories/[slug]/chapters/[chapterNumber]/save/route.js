import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Chapter from '@/models/Chapter'
import User from '@/models/User'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    const { slug, chapterNumber } = await params

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const chapter = await Chapter.findOne({ chapterNumber: parseInt(chapterNumber) })
      .populate('story', 'slug')
    
    if (!chapter || chapter.story.slug !== slug) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Update reading progress
    const existingProgress = user.readingProgress.find(p => p.story.toString() === chapter.story._id.toString())
    
    if (existingProgress) {
      existingProgress.lastChapter = chapter._id
      existingProgress.lastRead = new Date()
      existingProgress.progress = Math.round((parseInt(chapterNumber) / (chapter.story.chapters?.length || 1)) * 100)
    } else {
      user.readingProgress.push({
        story: chapter.story._id,
        lastChapter: chapter._id,
        progress: Math.round((parseInt(chapterNumber) / (chapter.story.chapters?.length || 1)) * 100),
        lastRead: new Date()
      })
    }

    await user.save()

    return NextResponse.json({ 
      message: 'Reading progress saved',
      progress: existingProgress?.progress || Math.round((parseInt(chapterNumber) / (chapter.story.chapters?.length || 1)) * 100)
    })

  } catch (error) {
    console.error('Save chapter progress error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}