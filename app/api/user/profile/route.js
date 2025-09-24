import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Story from '@/models/Story'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's story statistics
    const storyStats = await Story.aggregate([
      { $match: { author: user._id } },
      {
        $group: {
          _id: null,
          totalStories: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          publishedStories: {
            $sum: { $cond: [{ $ne: ['$status', 'draft'] }, 1, 0] }
          }
        }
      }
    ])

    const stats = storyStats[0] || {
      totalStories: 0,
      totalViews: 0,
      totalLikes: 0,
      publishedStories: 0
    }

    const profileData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      cover: user.cover,
      website: user.website,
      location: user.location,
      role: user.role,
      isVerified: user.isVerified,
      socialLinks: user.socialLinks,
      authorInfo: user.authorInfo,
      stats: {
        ...user.stats.toObject(),
        ...stats,
        followers: user.followers.length,
        following: user.following.length
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json({ profile: profileData })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const {
      name,
      bio,
      avatar,
      cover,
      website,
      location,
      socialLinks,
      authorInfo
    } = body

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update profile fields
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (avatar !== undefined) updateData.avatar = avatar
    if (cover !== undefined) updateData.cover = cover
    if (website !== undefined) updateData.website = website
    if (location !== undefined) updateData.location = location

    if (socialLinks) {
      updateData.socialLinks = {
        ...user.socialLinks.toObject(),
        ...socialLinks
      }
    }

    if (authorInfo) {
      updateData.authorInfo = {
        ...user.authorInfo.toObject(),
        ...authorInfo
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        cover: updatedUser.cover,
        website: updatedUser.website,
        location: updatedUser.location,
        role: updatedUser.role,
        socialLinks: updatedUser.socialLinks,
        authorInfo: updatedUser.authorInfo
      }
    })

  } catch (error) {
    console.error('Error updating profile:', error)

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}