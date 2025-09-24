import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import Chapter from '@/models/Chapter'
import User from '@/models/User'

// GET /api/stories/[slug] - Get a specific story by slug
export async function GET(request, { params }) {
  try {
    await dbConnect()
    const resolvedParams = await params

    const story = await Story.findOne({ slug: resolvedParams.slug })
      .populate('author', 'name username avatar bio followers')
      .populate({
        path: 'chapters',
        select: 'title chapterNumber status createdAt wordCount readingTime likes comments',
        match: { status: 'published' },
        options: { sort: { chapterNumber: 1 } }
      })
      .lean()

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this story
    if (story.visibility === 'private') {
      const session = await getServerSession(authOptions)
      if (!session || session.user.email !== story.author.email) {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        )
      }
    }

    // Increment views
    await Story.findByIdAndUpdate(story._id, { $inc: { views: 1 } })

    // Add computed fields
    const storyWithStats = {
      ...story,
      likes: story.likes?.length || 0,
      saves: story.saves?.length || 0,
      commentsCount: story.comments?.length || 0,
      chaptersCount: story.chapters?.length || 0,
    }

    return NextResponse.json({ story: storyWithStats })

  } catch (error) {
    console.error('Get story error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    )
  }
}

// PUT /api/stories/[slug] - Update a story
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()
    const resolvedParams = await params

    const body = await request.json()
    const { title, description, genre, tags, language, visibility, status } = body

    // Find the story
    const story = await Story.findOne({ slug: resolvedParams.slug })
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
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

    // Check if user is the author
    if (story.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Not authorized to update this story' },
        { status: 403 }
      )
    }

    // Update fields
    const updateData = {}
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (genre) updateData.genre = genre
    if (tags) updateData.tags = tags
    if (language) updateData.language = language
    if (visibility) updateData.visibility = visibility
    if (status) updateData.status = status

    // Update slug if title changed
    if (title && title !== story.title) {
      let newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100)

      // Check if new slug exists
      let uniqueSlug = newSlug
      let counter = 1
      while (await Story.findOne({ slug: uniqueSlug, _id: { $ne: story._id } })) {
        uniqueSlug = `${newSlug}-${counter}`
        counter++
      }

      updateData.slug = uniqueSlug
    }

    updateData.lastUpdated = new Date()

    // Check if user is publishing their first story
    if (status && story.status === 'draft' && (status === 'ongoing' || status === 'completed')) {
      // Check if user has any other published stories
      const publishedStoriesCount = await Story.countDocuments({
        author: user._id,
        status: { $in: ['ongoing', 'completed'] }
      })

      // If this is their first published story, update user role to 'writers'
      if (publishedStoriesCount === 0 && user.role !== 'writers' && user.role !== 'admin') {
        await User.findByIdAndUpdate(user._id, { role: 'writers' })
      }
    }

    const updatedStory = await Story.findByIdAndUpdate(
      story._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name username avatar')

    return NextResponse.json({
      message: 'Story updated successfully',
      story: {
        ...updatedStory.toObject(),
        likes: updatedStory.likes?.length || 0,
        saves: updatedStory.saves?.length || 0,
        commentsCount: updatedStory.comments?.length || 0,
        chaptersCount: updatedStory.chapters?.length || 0
      }
    })

  } catch (error) {
    console.error('Update story error:', error)

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update story' },
      { status: 500 }
    )
  }
}

// DELETE /api/stories/[slug] - Delete a story
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()
    const resolvedParams = await params

    // Find the story
    const story = await Story.findOne({ slug: resolvedParams.slug })
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
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

    // Check if user is the author
    if (story.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Not authorized to delete this story' },
        { status: 403 }
      )
    }

    // Delete all chapters first
    await Chapter.deleteMany({ story: story._id })

    // Delete the story
    await Story.findByIdAndDelete(story._id)

    return NextResponse.json({
      message: 'Story deleted successfully'
    })

  } catch (error) {
    console.error('Delete story error:', error)
    return NextResponse.json(
      { error: 'Failed to delete story' },
      { status: 500 }
    )
  }
}