'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Switch } from './switch'
import { Separator } from './separator'
import { Badge } from './badge'
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Check,
  AlertCircle,
  ExternalLink,
  TestTube
} from 'lucide-react'

export function NotificationSettings({ className }) {
  const { data: session } = useSession()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingPlatform, setTestingPlatform] = useState('')
  const [testResults, setTestResults] = useState({})

  useEffect(() => {
    if (session) {
      loadNotificationSettings()
    }
  }, [session])

  const loadNotificationSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/notifications')

      if (response.ok) {
        const data = await response.json()
        setSettings(data.notificationSettings)
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        setTestResults({ success: 'Settings saved successfully!' })
        setTimeout(() => setTestResults({}), 3000)
      } else {
        setTestResults({ error: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setTestResults({ error: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async (platform) => {
    try {
      setTestingPlatform(platform)
      const response = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform })
      })

      const data = await response.json()

      if (response.ok) {
        setTestResults({ [`${platform}_success`]: 'Test notification sent successfully!' })
      } else {
        setTestResults({ [`${platform}_error`]: data.error || 'Test failed' })
      }
    } catch (error) {
      console.error('Error testing notification:', error)
      setTestResults({ [`${platform}_error`]: 'Test failed' })
    } finally {
      setTestingPlatform('')
      setTimeout(() => setTestResults({}), 5000)
    }
  }

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sign in to manage your notification settings</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage how you receive updates about your stories and followers
        </p>
      </div>

      {/* Status Messages */}
      {testResults.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-700">{testResults.success}</span>
        </div>
      )}

      {testResults.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{testResults.error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications via email about your stories and interactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">New Chapters</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when authors you follow publish new chapters
                </p>
              </div>
              <Switch
                checked={settings?.email?.newChapters ?? true}
                onCheckedChange={(checked) => updateSetting('email', 'newChapters', checked)}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">New Followers</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when someone follows you
                </p>
              </div>
              <Switch
                checked={settings?.email?.newFollowers ?? true}
                onCheckedChange={(checked) => updateSetting('email', 'newFollowers', checked)}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">Story Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about likes, comments, and saves on your stories
                </p>
              </div>
              <Switch
                checked={settings?.email?.storyUpdates ?? true}
                onCheckedChange={(checked) => updateSetting('email', 'storyUpdates', checked)}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">Mentions</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when someone mentions you in comments
                </p>
              </div>
              <Switch
                checked={settings?.email?.mentions ?? true}
                onCheckedChange={(checked) => updateSetting('email', 'mentions', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discord Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Discord Notifications
              <Badge variant="outline" className="text-xs">Author Only</Badge>
            </CardTitle>
            <CardDescription>
              Send notifications to your Discord server when you publish new chapters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">Enable Discord</Label>
                <p className="text-xs text-muted-foreground">
                  Turn on Discord notifications for your content
                </p>
              </div>
              <Switch
                checked={settings?.discord?.enabled ?? false}
                onCheckedChange={(checked) => updateSetting('discord', 'enabled', checked)}
              />
            </div>

            {settings?.discord?.enabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Webhook URL</Label>
                  <Input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings.discord.webhookUrl === '***CONFIGURED***' ? '' : settings.discord.webhookUrl || ''}
                    onChange={(e) => updateSetting('discord', 'webhookUrl', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a webhook in your Discord server settings
                    <a
                      href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-primary hover:underline inline-flex items-center"
                    >
                      Learn more <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                  {settings.discord.webhookUrl === '***CONFIGURED***' && (
                    <Badge variant="secondary" className="text-xs">
                      Webhook URL is configured
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-medium">New Chapters</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify Discord when you publish new chapters
                    </p>
                  </div>
                  <Switch
                    checked={settings?.discord?.newChapters ?? false}
                    onCheckedChange={(checked) => updateSetting('discord', 'newChapters', checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-medium">Milestones</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify about story milestones (likes, views, etc.)
                    </p>
                  </div>
                  <Switch
                    checked={settings?.discord?.milestones ?? false}
                    onCheckedChange={(checked) => updateSetting('discord', 'milestones', checked)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification('discord')}
                    disabled={testingPlatform === 'discord' || !settings.discord.webhookUrl || settings.discord.webhookUrl === '***CONFIGURED***'}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingPlatform === 'discord' ? 'Testing...' : 'Test Discord'}
                  </Button>
                  {testResults.discord_success && (
                    <span className="ml-2 text-sm text-green-600">✓ {testResults.discord_success}</span>
                  )}
                  {testResults.discord_error && (
                    <span className="ml-2 text-sm text-red-600">✗ {testResults.discord_error}</span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Telegram Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Telegram Notifications
              <Badge variant="outline" className="text-xs">Author Only</Badge>
            </CardTitle>
            <CardDescription>
              Send notifications to your Telegram chat when you publish new chapters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">Enable Telegram</Label>
                <p className="text-xs text-muted-foreground">
                  Turn on Telegram notifications for your content
                </p>
              </div>
              <Switch
                checked={settings?.telegram?.enabled ?? false}
                onCheckedChange={(checked) => updateSetting('telegram', 'enabled', checked)}
              />
            </div>

            {settings?.telegram?.enabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bot Token</Label>
                  <Input
                    type="password"
                    placeholder="1234567890:ABC..."
                    value={settings.telegram.botToken === '***CONFIGURED***' ? '' : settings.telegram.botToken || ''}
                    onChange={(e) => updateSetting('telegram', 'botToken', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a bot with @BotFather on Telegram
                    <a
                      href="https://core.telegram.org/bots#6-botfather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-primary hover:underline inline-flex items-center"
                    >
                      Learn more <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                  {settings.telegram.botToken === '***CONFIGURED***' && (
                    <Badge variant="secondary" className="text-xs">
                      Bot token is configured
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Chat ID</Label>
                  <Input
                    placeholder="-1001234567890 or your user ID"
                    value={settings.telegram.chatId === '***CONFIGURED***' ? '' : settings.telegram.chatId || ''}
                    onChange={(e) => updateSetting('telegram', 'chatId', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your personal chat ID or group chat ID where notifications will be sent
                  </p>
                  {settings.telegram.chatId === '***CONFIGURED***' && (
                    <Badge variant="secondary" className="text-xs">
                      Chat ID is configured
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-medium">New Chapters</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify Telegram when you publish new chapters
                    </p>
                  </div>
                  <Switch
                    checked={settings?.telegram?.newChapters ?? false}
                    onCheckedChange={(checked) => updateSetting('telegram', 'newChapters', checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-medium">Milestones</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify about story milestones (likes, views, etc.)
                    </p>
                  </div>
                  <Switch
                    checked={settings?.telegram?.milestones ?? false}
                    onCheckedChange={(checked) => updateSetting('telegram', 'milestones', checked)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification('telegram')}
                    disabled={testingPlatform === 'telegram' || !settings.telegram.botToken || !settings.telegram.chatId || settings.telegram.botToken === '***CONFIGURED***'}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingPlatform === 'telegram' ? 'Testing...' : 'Test Telegram'}
                  </Button>
                  {testResults.telegram_success && (
                    <span className="ml-2 text-sm text-green-600">✓ {testResults.telegram_success}</span>
                  )}
                  {testResults.telegram_error && (
                    <span className="ml-2 text-sm text-red-600">✗ {testResults.telegram_error}</span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings