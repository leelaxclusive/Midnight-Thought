import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Story from '@/models/Story'

// PUT /api/user/reading-lists/[listId] - Update reading list
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { listId } = params
    const { name, description, isPublic } = await request.json()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const list = user.readingLists.id(listId)
    if (!list) {
      return NextResponse.json(
        { error: 'Reading list not found' },
        { status: 404 }
      )
    }

    // Update list properties
    if (name !== undefined) list.name = name.trim()
    if (description !== undefined) list.description = description
    if (isPublic !== undefined) list.isPublic = isPublic
    list.updatedAt = new Date()

    await user.save()

    return NextResponse.json({
      message: 'Reading list updated successfully',
      readingList: list
    })

  } catch (error) {
    console.error('Update reading list error:', error)
    return NextResponse.json(
      { error: 'Failed to update reading list' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/reading-lists/[listId] - Delete reading list
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { listId } = params

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const list = user.readingLists.id(listId)
    if (!list) {
      return NextResponse.json(
        { error: 'Reading list not found' },
        { status: 404 }
      )
    }

    // Remove the list
    user.readingLists.pull(listId)
    await user.save()

    return NextResponse.json({
      message: 'Reading list deleted successfully'
    })

  } catch (error) {
    console.error('Delete reading list error:', error)
    return NextResponse.json(
      { error: 'Failed to delete reading list' },
      { status: 500 }
    )
  }
}

// POST /api/user/reading-lists/[listId] - Add/remove story from reading list
export async function POST(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { listId } = params
    const { storyId, action } = await request.json() // action: 'add' or 'remove'

    if (!storyId || !action) {
      return NextResponse.json(
        { error: 'Story ID and action are required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify story exists
    const story = await Story.findById(storyId)
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    let success = false
    let message = ''

    if (action === 'add') {
      success = await user.addToReadingList(listId, storyId)
      message = success ? 'Story added to reading list' : 'Story already in reading list'
    } else if (action === 'remove') {
      success = await user.removeFromReadingList(listId, storyId)
      message = success ? 'Story removed from reading list' : 'Story not in reading list'
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message,
      success
    })

  } catch (error) {
    console.error('Manage reading list story error:', error)
    return NextResponse.json(
      { error: 'Failed to manage story in reading list' },
      { status: 500 }
    )
  }
}