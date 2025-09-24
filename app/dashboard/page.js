'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navigation/Navbar'
import Link from 'next/link'
import { PenTool, BookOpen, Heart, Eye, Users, TrendingUp, Plus, MoreHorizontal, Edit, Trash2, Calendar, Clock, Settings } from 'lucide-react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState({
    totalStories: 0,
    totalViews: 0,
    totalLikes: 0,
    followers: 0
  })
  const [myStories, setMyStories] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadDashboardData()
    }
  }, [session])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load user's stories
      const storiesResponse = await fetch('/api/user/stories')
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json()
        setMyStories(storiesData.stories)

        // Calculate stats from stories
        const totalStories = storiesData.stories.length
        const totalViews = storiesData.stories.reduce((sum, story) => sum + (story.views || 0), 0)
        const totalLikes = storiesData.stories.reduce((sum, story) => sum + (story.likesCount || 0), 0)

        setStats({
          totalStories,
          totalViews,
          totalLikes,
          followers: 0 // TODO: Implement followers system
        })
      }

      // Load recent activity from API
      try {
        const activityResponse = await fetch('/api/user/activity')
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setRecentActivity(activityData.activities || [])
        } else {
          setRecentActivity([])
        }
      } catch (error) {
        console.error('Error loading activity:', error)
        setRecentActivity([])
      }

      // Load scheduled posts from API
      try {
        const scheduledResponse = await fetch('/api/user/scheduled-posts')
        if (scheduledResponse.ok) {
          const scheduledData = await scheduledResponse.json()
          setScheduledPosts(scheduledData.posts || [])
        } else {
          setScheduledPosts([])
        }
      } catch (error) {
        console.error('Error loading scheduled posts:', error)
        setScheduledPosts([])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours === 0) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <Users className="h-4 w-4 text-green-500" />
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'like':
        return `${activity.user} liked your story "${activity.story}"`
      case 'comment':
        return `${activity.user} commented on "${activity.story}"`
      case 'follow':
        return `${activity.user} started following you`
      default:
        return `${activity.user} viewed your story`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {session?.user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your stories
            </p>
          </div>
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/stories">
                <Settings className="h-4 w-4 mr-2" />
                Manage Stories
              </Link>
            </Button>
            <Button asChild>
              <Link href="/write">
                <Plus className="h-4 w-4 mr-2" />
                New Story
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStories}</div>
              <p className="text-xs text-muted-foreground">
                +1 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.followers}</div>
              <p className="text-xs text-muted-foreground">
                +3 new followers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Stories */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Stories</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/stories">
                      <Settings className="h-4 w-4 mr-1" />
                      Manage All
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/write">
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Link>
                  </Button>
                </div>
              </div>
              <CardDescription>Manage your published and draft stories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myStories.map((story) => (
                <div key={story._id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{story.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {story.genre}
                      </Badge>
                      <Badge variant={story.status === 'published' ? 'default' : 'outline'} className="text-xs">
                        {story.status}
                      </Badge>
                      <Badge variant={story.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                        {story.visibility}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{story.chaptersCount || 0} chapters</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {story.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {story.likesCount || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {getTimeAgo(new Date(story.lastUpdated || story.createdAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/stories/${story.slug}/chapters`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/write?story=${story.slug}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/story/${story.slug}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}

              {myStories.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven&apos;t created any stories yet.</p>
                  <Button asChild>
                    <Link href="/write">
                      <PenTool className="h-4 w-4 mr-2" />
                      Write Your First Story
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions with your stories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeAgo(activity.time)}
                    </p>
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recent activity.</p>
                  <p className="text-sm text-muted-foreground">
                    Start writing and publishing stories to see interactions here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Posts */}
        {scheduledPosts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Posts ({scheduledPosts.length})
              </CardTitle>
              <CardDescription>
                Your upcoming scheduled chapters and stories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-blue-50/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {post.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {post.status}
                      </Badge>
                    </div>
                    <h3 className="font-medium truncate">
                      {post.type === 'chapter' ? post.chapterTitle : post.storyTitle}
                    </h3>
                    {post.type === 'chapter' && (
                      <p className="text-sm text-muted-foreground">
                        from &quot;{post.storyTitle}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Scheduled for {new Date(post.scheduledDate).toLocaleDateString()} at{' '}
                        {new Date(post.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/write?tab=schedule">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule New Post
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/write" className="flex flex-col items-center space-y-2">
                <PenTool className="h-6 w-6" />
                <span>Write New Story</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/explore" className="flex flex-col items-center space-y-2">
                <BookOpen className="h-6 w-6" />
                <span>Discover Stories</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/profile" className="flex flex-col items-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}