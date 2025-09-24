import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

// POST /api/users/[username]/follow - Follow/unfollow a user
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

    const { username } = params
    const { action } = await request.json() // 'follow' or 'unfollow'

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      )
    }

    // Find the target user
    const targetUser = await User.findOne({ username })
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent following yourself
    if (currentUser._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    let success = false
    let isFollowing = false

    if (action === 'follow') {
      success = await currentUser.follow(targetUser._id)
      isFollowing = true
    } else if (action === 'unfollow') {
      success = await currentUser.unfollow(targetUser._id)
      isFollowing = false
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "follow" or "unfollow"' },
        { status: 400 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { error: `Already ${action}ing this user` },
        { status: 400 }
      )
    }

    // Get updated follower counts
    const updatedTargetUser = await User.findById(targetUser._id)

    return NextResponse.json({
      message: `Successfully ${action}ed ${targetUser.name}`,
      isFollowing,
      followerCount: updatedTargetUser.followers.length,
      followingCount: updatedTargetUser.following.length
    })

  } catch (error) {
    console.error('Follow/unfollow error:', error)
    return NextResponse.json(
      { error: 'Failed to process follow request' },
      { status: 500 }
    )
  }
}

// GET /api/users/[username]/follow - Check if current user follows this user
export async function GET(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ isFollowing: false })
    }

    await dbConnect()

    const { username } = params

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ isFollowing: false })
    }

    // Find the target user
    const targetUser = await User.findOne({ username })
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isFollowing = currentUser.isFollowing(targetUser._id)

    return NextResponse.json({
      isFollowing,
      followerCount: targetUser.followers.length,
      followingCount: targetUser.following.length
    })

  } catch (error) {
    console.error('Check following status error:', error)
    return NextResponse.json(
      { error: 'Failed to check following status' },
      { status: 500 }
    )
  }
}