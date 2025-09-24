'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Progress } from './progress'
import { FollowButton } from './follow-button'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { StarDisplay } from './star-rating'
import {
  MapPin,
  Calendar,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Music,
  MessageCircle,
  BookOpen,
  Users,
  Eye,
  Heart,
  Star,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react'
import Link from 'next/link'

const socialIcons = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music,
  discord: MessageCircle,
  goodreads: BookOpen,
  wattpad: BookOpen
}

export function EnhancedAuthorProfile({ username, className }) {
  const { data: session } = useSession()
  const [author, setAuthor] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (username) {
      loadAuthorProfile()
    }
  }, [username])

  const loadAuthorProfile = async () => {
    try {
      setLoading(true)

      // Load author details
      const authorResponse = await fetch(`/api/users/${username}`)
      if (authorResponse.ok) {
        const authorData = await authorResponse.json()
        setAuthor(authorData.user)
      }

      // Load author's stories
      const storiesResponse = await fetch(`/api/stories?author=${username}&limit=6`)
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json()
        setStories(storiesData.stories || [])
      }
    } catch (error) {
      console.error('Error loading author profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days < 30) return `${days} days ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!author) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Author not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header Section */}
      <Card className="mb-6">
        <CardContent className="p-0">
          {/* Cover Image */}
          {author.cover && (
            <div
              className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20 bg-cover bg-center"
              style={{ backgroundImage: `url(${author.cover})` }}
            />
          )}

          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className={`${author.cover ? '-mt-16' : ''} relative`}>
                <Avatar className="w-24 h-24 border-4 border-background">
                  <AvatarImage src={author.avatar} alt={author.name} />
                  <AvatarFallback className="text-2xl">{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {author.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-white fill-current" />
                  </div>
                )}
              </div>

              {/* Author Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">
                      {author.authorInfo?.pseudonym || author.name}
                      {author.authorInfo?.pseudonym && (
                        <span className="text-lg text-muted-foreground ml-2">
                          ({author.name})
                        </span>
                      )}
                    </h1>
                    <p className="text-muted-foreground">@{author.username}</p>

                    {/* Writing Experience Badge */}
                    {author.authorInfo?.writingExperience && (
                      <Badge variant="secondary" className="mt-2">
                        {author.authorInfo.writingExperience.charAt(0).toUpperCase() +
                         author.authorInfo.writingExperience.slice(1)} Writer
                      </Badge>
                    )}
                  </div>

                  {/* Follow Button */}
                  <FollowButton
                    targetUsername={author.username}
                    targetUserId={author._id}
                    initialFollowerCount={author.followers?.length || 0}
                  />
                </div>

                {/* Bio */}
                {author.bio && (
                  <p className="text-foreground leading-relaxed mb-4">{author.bio}</p>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(author.stats?.totalStoriesPublished || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Stories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(author.followers?.length || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(author.stats?.totalViews || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {author.stats?.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>

                {/* Location & Joined Date */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  {author.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {author.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {getTimeAgo(author.createdAt)}
                  </div>
                </div>

                {/* Social Links */}
                {author.socialLinks && Object.entries(author.socialLinks).some(([_, url]) => url) && (
                  <div className="flex flex-wrap gap-2">
                    {author.website && (
                      <a
                        href={author.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {Object.entries(author.socialLinks).map(([platform, url]) => {
                      if (!url) return null
                      const Icon = socialIcons[platform]
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {['overview', 'stories', 'stats', 'achievements'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            size="sm"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Writing Goals */}
          {author.authorInfo?.writingGoals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Writing Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {author.authorInfo.writingGoals.dailyWordTarget > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Daily Word Target</span>
                      <span className="text-sm text-muted-foreground">
                        {author.authorInfo.writingGoals.dailyWordTarget} words
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">
                      {author.authorInfo.writingGoals.currentStreak || 0} day streak
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      Best: {author.authorInfo.writingGoals.longestStreak || 0} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferred Genres */}
          {author.authorInfo?.genres?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preferred Genres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {author.authorInfo.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Stories */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Stories</CardTitle>
                {stories.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${username}?tab=stories`}>
                      View All Stories
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {stories.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No published stories yet.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stories.slice(0, 6).map((story) => (
                    <Card key={story._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {story.genre}
                          </Badge>
                          <Badge variant={story.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                            {story.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium line-clamp-2 mb-2">
                          <Link href={`/story/${story.slug}`} className="hover:underline">
                            {story.title}
                          </Link>
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {story.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {story.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {story.likesCount || 0}
                            </span>
                          </div>
                          {story.rating?.average > 0 && (
                            <StarDisplay rating={story.rating.average} size="small" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Writing Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Writing Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(author.stats?.totalWordsWritten || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Words Written</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {author.stats?.totalChaptersPublished || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Chapters</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Likes</span>
                  <span className="font-medium">{formatNumber(author.stats?.totalLikes || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Comments</span>
                  <span className="font-medium">{formatNumber(author.stats?.totalComments || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Reviews</span>
                  <span className="font-medium">{author.stats?.totalReviews || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{author.stats?.averageRating?.toFixed(1) || '0.0'}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'achievements' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {author.authorInfo?.achievements?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {author.authorInfo.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Earned {getTimeAgo(achievement.earnedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No achievements yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedAuthorProfile