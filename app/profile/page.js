'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navigation/Navbar'
import { UploadButton } from '@/lib/utils/uploadthing'
import { User, Settings, Camera, Save, AlertCircle, CheckCircle, Upload, Globe, MapPin } from 'lucide-react'
import Image from 'next/image'

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    avatar: '',
    cover: '',
    website: '',
    location: '',
    role: 'reader',
    socialLinks: {
      twitter: '',
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
      discord: '',
      goodreads: '',
      wattpad: ''
    },
    stats: {
      totalStories: 0,
      totalViews: 0,
      totalLikes: 0,
      followers: 0,
      following: 0,
      publishedStories: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadProfileData()
    }
  }, [session])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')

      if (response.ok) {
        const data = await response.json()
        const profile = data.profile

        setProfileData({
          name: profile.name || '',
          username: profile.username || '',
          email: profile.email || '',
          bio: profile.bio || '',
          avatar: profile.avatar || '',
          cover: profile.cover || '',
          website: profile.website || '',
          location: profile.location || '',
          role: profile.role || 'reader',
          socialLinks: {
            twitter: profile.socialLinks?.twitter || '',
            instagram: profile.socialLinks?.instagram || '',
            facebook: profile.socialLinks?.facebook || '',
            youtube: profile.socialLinks?.youtube || '',
            tiktok: profile.socialLinks?.tiktok || '',
            discord: profile.socialLinks?.discord || '',
            goodreads: profile.socialLinks?.goodreads || '',
            wattpad: profile.socialLinks?.wattpad || ''
          },
          stats: {
            totalStories: profile.stats?.totalStories || 0,
            totalViews: profile.stats?.totalViews || 0,
            totalLikes: profile.stats?.totalLikes || 0,
            followers: profile.stats?.followers || 0,
            following: profile.stats?.following || 0,
            publishedStories: profile.stats?.publishedStories || 0
          }
        })
      } else {
        setError('Failed to load profile data')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile data')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          bio: profileData.bio,
          avatar: profileData.avatar,
          cover: profileData.cover,
          website: profileData.website,
          location: profileData.location,
          socialLinks: profileData.socialLinks
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Profile updated successfully!')

        // Reload profile data to reflect changes
        await loadProfileData()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.replace('socialLinks.', '')
      setProfileData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }))
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleImageUpload = (type) => (res) => {
    if (res?.[0]?.url) {
      setProfileData(prev => ({
        ...prev,
        [type]: res[0].url
      }))
      setSuccess(`${type === 'avatar' ? 'Profile picture' : 'Cover image'} uploaded successfully!`)
    }
  }

  const handleUploadError = (error) => {
    console.error('Upload error:', error)
    setError('Failed to upload image. Please try again.')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="lg:col-span-2 h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar} alt={profileData.name} />
                    <AvatarFallback className="text-lg">
                      {profileData.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0">
                    <UploadButton
                      endpoint="avatar"
                      onClientUploadComplete={handleImageUpload('avatar')}
                      onUploadError={handleUploadError}
                      appearance={{
                        button: "bg-primary text-primary-foreground rounded-full p-2 w-8 h-8 text-xs hover:bg-primary/90",
                        allowedContent: "hidden"
                      }}
                      content={{
                        button: <Camera className="h-3 w-3" />
                      }}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-lg">{profileData.name}</h3>
                  <p className="text-muted-foreground">@{profileData.username}</p>
                  <Badge variant="secondary" className="mt-2">
                    {profileData.role}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Stories Published:</span>
                    <span className="ml-2 text-muted-foreground">{profileData.stats.publishedStories}</span>
                  </div>
                  <div>
                    <span className="font-medium">Total Views:</span>
                    <span className="ml-2 text-muted-foreground">{profileData.stats.totalViews.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Total Likes:</span>
                    <span className="ml-2 text-muted-foreground">{profileData.stats.totalLikes.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Followers:</span>
                    <span className="ml-2 text-muted-foreground">{profileData.stats.followers}</span>
                  </div>
                  <div>
                    <span className="font-medium">Following:</span>
                    <span className="ml-2 text-muted-foreground">{profileData.stats.following}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and bio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        placeholder="Choose a username"
                        required
                        minLength={3}
                        maxLength={20}
                      />
                      <p className="text-xs text-muted-foreground">
                        This is your unique identifier on the platform
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll use this to send you important updates about your account
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      {profileData.bio.length}/500 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="website">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={profileData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex items-center space-x-4">
                      {profileData.cover ? (
                        <Image
                          src={profileData.cover}
                          alt="Cover"
                          width={128}
                          height={80}
                          className="w-32 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">No cover</span>
                        </div>
                      )}
                      <UploadButton
                        endpoint="cover"
                        onClientUploadComplete={handleImageUpload('cover')}
                        onUploadError={handleUploadError}
                        appearance={{
                          button: "bg-primary text-primary-foreground hover:bg-primary/90",
                        }}
                        content={{
                          button: ({ ready }) => ready ? "Upload Cover" : "Preparing..."
                        }}
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Social Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter/X</Label>
                        <Input
                          id="twitter"
                          value={profileData.socialLinks.twitter}
                          onChange={(e) => handleChange('socialLinks.twitter', e.target.value)}
                          placeholder="https://twitter.com/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={profileData.socialLinks.instagram}
                          onChange={(e) => handleChange('socialLinks.instagram', e.target.value)}
                          placeholder="https://instagram.com/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={profileData.socialLinks.youtube}
                          onChange={(e) => handleChange('socialLinks.youtube', e.target.value)}
                          placeholder="https://youtube.com/@username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tiktok">TikTok</Label>
                        <Input
                          id="tiktok"
                          value={profileData.socialLinks.tiktok}
                          onChange={(e) => handleChange('socialLinks.tiktok', e.target.value)}
                          placeholder="https://tiktok.com/@username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="goodreads">Goodreads</Label>
                        <Input
                          id="goodreads"
                          value={profileData.socialLinks.goodreads}
                          onChange={(e) => handleChange('socialLinks.goodreads', e.target.value)}
                          placeholder="https://goodreads.com/user/show/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="wattpad">Wattpad</Label>
                        <Input
                          id="wattpad"
                          value={profileData.socialLinks.wattpad}
                          onChange={(e) => handleChange('socialLinks.wattpad', e.target.value)}
                          placeholder="https://wattpad.com/user/username"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="mt-8 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-red-600/80">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}