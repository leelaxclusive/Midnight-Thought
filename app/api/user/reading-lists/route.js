import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

// GET /api/user/reading-lists - Get user's reading lists
export async function GET(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .populate('readingLists.stories', 'title slug author genre status description')
      .populate('readingLists.stories.author', 'name username')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      readingLists: user.readingLists
    })

  } catch (error) {
    console.error('Get reading lists error:', error)
    return NextResponse.json(
      { error: 'Failed to get reading lists' },
      { status: 500 }
    )
  }
}

// POST /api/user/reading-lists - Create a new reading list
export async function POST(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { name, description, isPublic } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'List name is required' },
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

    // Check if list name already exists
    const existingList = user.readingLists.find(list =>
      list.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (existingList) {
      return NextResponse.json(
        { error: 'A reading list with this name already exists' },
        { status: 400 }
      )
    }

    await user.createReadingList(name.trim(), description || '', isPublic || false)

    // Get the newly created list
    const updatedUser = await User.findById(user._id)
    const newList = updatedUser.readingLists[updatedUser.readingLists.length - 1]

    return NextResponse.json({
      message: 'Reading list created successfully',
      readingList: newList
    }, { status: 201 })

  } catch (error) {
    console.error('Create reading list error:', error)
    return NextResponse.json(
      { error: 'Failed to create reading list' },
      { status: 500 }
    )
  }
}