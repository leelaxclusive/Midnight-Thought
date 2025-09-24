'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Navbar from '@/components/navigation/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  Heart,
  Eye,
  Users,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageCircle,
  Clock,
  TrendingUp,
  Award,
  UserPlus,
  UserMinus
} from 'lucide-react'

export default function AuthorProfile({ params }) {
  const { data: session } = useSession()
  const [author, setAuthor] = useState(null)
  const [stories, setStories] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('stories')
  const [username, setUsername] = useState(null)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setUsername(resolvedParams.username)
    }
    getParams()
  }, [params])

  const loadAuthorData = useCallback(async (username) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/users/${username}`)

      if (!response.ok) {
        if (response.status === 404) {
          setAuthor(null)
          setStories([])
          setStats({})
        } else {
          console.error('Failed to fetch user profile')
        }
        setLoading(false)
        return
      }

      const data = await response.json()

      // Convert date strings to Date objects
      const author = {
        ...data.user,
        joinedAt: new Date(data.user.joinedAt)
      }

      const stories = data.stories.map(story => ({
        ...story,
        createdAt: new Date(story.createdAt),
        updatedAt: new Date(story.updatedAt)
      }))

      setAuthor(author)
      setStories(stories)
      setStats(data.stats)
      setLoading(false)

      // Set following status if user is logged in
      if (session && session.user.username !== username) {
        setIsFollowing(false) // TODO: Implement follow status check
      }

    } catch (error) {
      console.error('Error loading author data:', error)
      setAuthor(null)
      setStories([])
      setStats({})
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (username) {
      loadAuthorData(username)
    }
  }, [username, loadAuthorData])

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // API call would go here
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const months = Math.floor(days / 30)

    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
  }

  const getMembershipDuration = (joinDate) => {
    const now = new Date()
    const diff = now - joinDate
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
    const years = Math.floor(months / 12)

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    }
    return `${months} month${months > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded-lg"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Author Not Found</h1>
            <p className="text-muted-foreground mb-4">The author you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild>
              <Link href="/explore">Discover Stories</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = session?.user?.username === author.username

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 relative">
          {author.cover && (
            <Image
              src={author.cover}
              alt="Profile cover"
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Profile Info */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback className="text-2xl">{author.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{author.name}</h1>
                      {author.isVerified && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground">@{author.username}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined {getMembershipDuration(author.joinedAt)} ago
                      </div>
                      {author.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {author.location}
                        </div>
                      )}
                      {author.website && (
                        <Link href={author.website} target="_blank" className="flex items-center hover:text-foreground">
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Website
                        </Link>
                      )}
                    </div>
                  </div>

                  {session && !isOwnProfile && (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "secondary" : "default"}
                      className="mt-4 sm:mt-0"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}

                  {isOwnProfile && (
                    <Button asChild variant="outline" className="mt-4 sm:mt-0">
                      <Link href="/profile">
                        Edit Profile
                      </Link>
                    </Button>
                  )}
                </div>

                <p className="mt-4 text-foreground leading-relaxed max-w-3xl">{author.bio}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{author.followers}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{author.following}</span>
                    <span className="text-muted-foreground">following</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{author.totalStories}</span>
                    <span className="text-muted-foreground">stories</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{author.totalViews.toLocaleString()}</span>
                    <span className="text-muted-foreground">total views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{author.totalLikes}</span>
                    <span className="text-muted-foreground">total likes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Views</span>
                  <span className="font-medium">{stats.monthlyViews?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Likes</span>
                  <span className="font-medium">{stats.monthlyLikes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Words</span>
                  <span className="font-medium">{stats.totalWords?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reading Time</span>
                  <span className="font-medium">{Math.floor(stats.readingTime / 60)}h {stats.readingTime % 60}m</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {author.achievements && author.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {author.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Popular Genres */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Genres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Fantasy</Badge>
                  <Badge variant="outline">Science Fiction</Badge>
                  <Badge variant="outline">Thriller</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stories">Stories</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="stories" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Published Stories</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Sorted by popularity</span>
                  </div>
                </div>

                <div className="grid gap-6">
                  {stories.map((story) => (
                    <Card key={story._id || story.slug} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{story.genre}</Badge>
                            <Badge variant={story.status === 'completed' ? 'default' : 'outline'}>
                              {story.status}
                            </Badge>
                            {story.featured && <Badge variant="default">Featured</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Updated {getTimeAgo(story.updatedAt)}
                          </div>
                        </div>
                        <CardTitle className="line-clamp-2">
                          <Link href={`/story/${story.slug}`} className="hover:text-primary">
                            {story.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                          {story.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {story.tags.slice(0, 4).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {story.chapters} chapters
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {story.views.toLocaleString()}
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {story.likes}
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {story.comments}
                            </div>
                          </div>

                          <Button asChild size="sm">
                            <Link href={`/story/${story.slug}`}>
                              Read Story
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {stories.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No stories yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "Start writing your first story!" : `${author.name} hasn't published any stories yet.`}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No recent activity</h3>
                    <p className="text-muted-foreground">Activity will appear here once the author starts interacting.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about" className="space-y-6">
                <h2 className="text-xl font-semibold">About {author.name}</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                      <p className="leading-relaxed">{author.bio}</p>

                      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Member Since</h4>
                          <p className="text-muted-foreground">{author.joinedAt.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Favorite Genre</h4>
                          <p className="text-muted-foreground">{stats.mostPopularGenre}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Stories Published</h4>
                          <p className="text-muted-foreground">{author.totalStories}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Total Words Written</h4>
                          <p className="text-muted-foreground">{stats.totalWords?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}