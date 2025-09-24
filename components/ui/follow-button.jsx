'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './button'
import { UserPlus, UserMinus, Users } from 'lucide-react'

export function FollowButton({
  targetUsername,
  targetUserId,
  initialFollowingState = false,
  initialFollowerCount = 0,
  variant = "default",
  size = "default",
  showCount = true,
  className
}) {
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(initialFollowingState)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  // Check following status on mount if user is logged in
  useEffect(() => {
    if (session && targetUsername) {
      checkFollowingStatus()
    }
  }, [session, targetUsername])

  const checkFollowingStatus = async () => {
    try {
      const response = await fetch(`/api/users/${targetUsername}/follow`)
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing)
        setFollowerCount(data.followerCount || 0)
      }
    } catch (error) {
      console.error('Error checking following status:', error)
    }
  }

  const handleFollowToggle = async () => {
    if (!session) {
      // Redirect to login or show login modal
      window.location.href = '/auth/signin'
      return
    }

    setLoading(true)

    try {
      const action = isFollowing ? 'unfollow' : 'follow'

      const response = await fetch(`/api/users/${targetUsername}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (response.ok) {
        setIsFollowing(data.isFollowing)
        setFollowerCount(data.followerCount || 0)
      } else {
        console.error('Follow/unfollow error:', data.error)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show follow button for user's own profile
  if (session && session.user.email === targetUserId) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isFollowing ? "outline" : variant}
        size={size}
        onClick={handleFollowToggle}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : isFollowing ? (
          <UserMinus className="h-4 w-4 mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>

      {showCount && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span>{followerCount} {followerCount === 1 ? 'follower' : 'followers'}</span>
        </div>
      )}
    </div>
  )
}

export default FollowButton