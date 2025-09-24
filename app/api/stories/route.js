import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import Story from '@/models/Story'
import User from '@/models/User'

// GET /api/stories - Get all stories with filtering and pagination
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const genre = searchParams.get('genre')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const search = searchParams.get('search')

    // Build query
    let query = {
      visibility: 'public',
      status: { $ne: 'draft' } // Exclude draft stories from public listing
    }

    if (genre && genre !== 'all') {
      query.genre = genre
    }

    if (status && status !== 'all') {
      query.status = status // Override the default filter if specific status is requested
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Build sort
    let sort = {}
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 }
        break
      case 'oldest':
        sort = { createdAt: 1 }
        break
      case 'popular':
        sort = { views: -1 }
        break
      case 'likes':
        sort = { 'likes.length': -1 }
        break
      default:
        sort = { createdAt: -1 }
    }

    const skip = (page - 1) * limit

    const stories = await Story.find(query)
      .populate('author', 'name username avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Add computed fields
    const storiesWithStats = stories.map(story => ({
      ...story,
      likesCount: story.likes?.length || 0,
      savesCount: story.saves?.length || 0,
      commentsCount: story.comments?.length || 0,
      chaptersCount: story.chapters?.length || 0
    }))

    const total = await Story.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      stories: storiesWithStats,
      pagination: {
        current: page,
        total: totalPages,
        limit,
        totalStories: total
      }
    })

  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

// POST /api/stories - Create a new story
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

    const body = await request.json()
    const { title, description, genre, tags, language, visibility } = body

    // Validate required fields
    if (!title || !description || !genre) {
      return NextResponse.json(
        { error: 'Title, description, and genre are required' },
        { status: 400 }
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

    // Generate slug from title
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100)

    // Check if slug exists and make it unique
    let uniqueSlug = slug
    let counter = 1
    while (await Story.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // Create story
    const story = await Story.create({
      title,
      slug: uniqueSlug,
      description,
      genre,
      tags: tags || [],
      language: language || 'English',
      visibility: visibility || 'public',
      author: user._id,
      status: 'draft'
    })

    await story.populate('author', 'name username avatar')

    return NextResponse.json(
      {
        message: 'Story created successfully',
        story: {
          ...story.toObject(),
          likesCount: 0,
          savesCount: 0,
          commentsCount: 0,
          chaptersCount: 0
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create story error:', error)

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A story with this title already exists' },
        { status: 409 }
      )
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    )
  }
}