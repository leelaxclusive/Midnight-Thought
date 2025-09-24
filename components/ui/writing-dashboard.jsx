'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Progress } from './progress'
import { Badge } from './badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import {
  Calendar,
  Target,
  TrendingUp,
  Clock,
  PenTool,
  Award,
  Settings,
  BookOpen,
  Zap,
  BarChart3,
  Trophy,
  Flame
} from 'lucide-react'

export function WritingDashboard({ className }) {
  const { data: session } = useSession()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showGoalsDialog, setShowGoalsDialog] = useState(false)
  const [goals, setGoals] = useState({
    dailyWordTarget: 500,
    monthlyChapterTarget: 4
  })

  useEffect(() => {
    if (session) {
      loadWritingStats()
    }
  }, [session])

  const loadWritingStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/writing-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setGoals({
          dailyWordTarget: data.user.writingGoals.dailyWordTarget || 500,
          monthlyChapterTarget: data.user.writingGoals.monthlyChapterTarget || 4
        })
      }
    } catch (error) {
      console.error('Error loading writing stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGoals = async () => {
    try {
      const response = await fetch('/api/user/writing-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goals)
      })

      if (response.ok) {
        await loadWritingStats()
        setShowGoalsDialog(false)
      }
    } catch (error) {
      console.error('Error updating goals:', error)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getDailyProgress = () => {
    if (!stats) return 0
    const today = new Date().toISOString().split('T')[0]
    const todayStats = stats.daily.find(day => day.date === today)
    const wordsToday = todayStats?.wordsWritten || 0
    return Math.min((wordsToday / goals.dailyWordTarget) * 100, 100)
  }

  const getWeeklyProgress = () => {
    if (!stats) return 0
    const weeklyTarget = goals.dailyWordTarget * 7
    return Math.min((stats.weekly.wordsWritten / weeklyTarget) * 100, 100)
  }

  const getMonthlyProgress = () => {
    if (!stats) return 0
    const monthlyTarget = goals.monthlyChapterTarget
    const chaptersThisMonth = Math.floor(stats.monthly.wordsWritten / 2000) // Assuming ~2000 words per chapter
    return Math.min((chaptersThisMonth / monthlyTarget) * 100, 100)
  }

  const getStreakColor = (streak) => {
    if (streak >= 30) return 'text-purple-600'
    if (streak >= 14) return 'text-orange-600'
    if (streak >= 7) return 'text-yellow-600'
    if (streak >= 3) return 'text-green-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Writing to See Stats</h3>
            <p className="text-muted-foreground">
              Begin your writing journey to track your progress and achievements
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Writing Streak</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getStreakColor(stats.streaks.current)}`}>
                    {stats.streaks.current}
                  </p>
                  <Flame className={`h-5 w-5 ${getStreakColor(stats.streaks.current)}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Best: {stats.streaks.longest} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Words</p>
                <p className="text-2xl font-bold">
                  {stats.daily.find(d => d.date === new Date().toISOString().split('T')[0])?.wordsWritten || 0}
                </p>
                <div className="mt-2">
                  <Progress value={getDailyProgress()} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Goal: {goals.dailyWordTarget} words
                  </p>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold">{stats.user.stats.totalWordsWritten.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Across {stats.user.stats.totalChaptersPublished} chapters
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Writing</p>
                <p className="text-2xl font-bold">{formatTime(stats.monthly.timeSpent)}</p>
                <p className="text-xs text-muted-foreground">
                  This month ({stats.monthly.sessions} sessions)
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Set Goals
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Writing Goals</DialogTitle>
                <DialogDescription>
                  Set your daily and monthly writing targets to track progress
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-target">Daily Word Target</Label>
                  <Input
                    id="daily-target"
                    type="number"
                    value={goals.dailyWordTarget}
                    onChange={(e) => setGoals(prev => ({
                      ...prev,
                      dailyWordTarget: parseInt(e.target.value) || 0
                    }))}
                    placeholder="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-target">Monthly Chapter Target</Label>
                  <Input
                    id="monthly-target"
                    type="number"
                    value={goals.monthlyChapterTarget}
                    onChange={(e) => setGoals(prev => ({
                      ...prev,
                      monthlyChapterTarget: parseInt(e.target.value) || 0
                    }))}
                    placeholder="4"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowGoalsDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateGoals}>
                    Save Goals
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="progress" className="space-y-6">
          {/* Weekly Progress */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Progress</CardTitle>
                <CardDescription>
                  {stats.weekly.wordsWritten} / {goals.dailyWordTarget * 7} words
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={getWeeklyProgress()} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(getWeeklyProgress())}% complete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Goal</CardTitle>
                <CardDescription>
                  {Math.floor(stats.monthly.wordsWritten / 2000)} / {goals.monthlyChapterTarget} chapters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={getMonthlyProgress()} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(getMonthlyProgress())}% complete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Writing Sessions</CardTitle>
                <CardDescription>This week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{stats.weekly.sessions}</div>
                <p className="text-sm text-muted-foreground">
                  Avg: {formatTime(stats.weekly.timeSpent / Math.max(stats.weekly.sessions, 1))} per session
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity (Last 7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {stats.daily.slice(-7).map((day, index) => {
                  const progress = Math.min((day.wordsWritten / goals.dailyWordTarget) * 100, 100)
                  const date = new Date(day.date)
                  const dayName = date.toLocaleDateString('en', { weekday: 'short' })

                  return (
                    <div key={index} className="text-center">
                      <div className="text-xs font-medium mb-2">{dayName}</div>
                      <div className="h-20 bg-muted rounded-lg flex items-end p-1">
                        <div
                          className="w-full bg-blue-500 rounded opacity-80"
                          style={{ height: `${Math.max(progress, 5)}%` }}
                          title={`${day.wordsWritten} words`}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {day.wordsWritten}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Writing Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average words per day</span>
                  <Badge variant="secondary">
                    {Math.round(stats.monthly.wordsWritten / 30)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average session time</span>
                  <Badge variant="secondary">
                    {formatTime(stats.monthly.timeSpent / Math.max(stats.monthly.sessions, 1))}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Most productive day</span>
                  <Badge variant="secondary">
                    {stats.daily.reduce((max, day) =>
                      day.wordsWritten > max.wordsWritten ? day : max,
                      { wordsWritten: 0, date: 'None' }
                    ).date !== 'None' ? new Date(stats.daily.reduce((max, day) =>
                      day.wordsWritten > max.wordsWritten ? day : max
                    ).date).toLocaleDateString('en', { weekday: 'short' }) : 'None'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Words per minute</span>
                  <Badge variant="secondary">
                    {Math.round(stats.monthly.wordsWritten / Math.max(stats.monthly.timeSpent / 60, 1))}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Publishing consistency</span>
                  <Badge variant="secondary">
                    {Math.round((stats.user.stats.totalStoriesPublished / Math.max(stats.user.stats.totalChaptersPublished, 1)) * 100)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Reader engagement</span>
                  <Badge variant="secondary">
                    {stats.user.stats.averageRating.toFixed(1)} ★
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Streak Achievements */}
            <Card className={`${stats.streaks.current >= 7 ? 'border-yellow-200 bg-yellow-50' : 'opacity-60'}`}>
              <CardContent className="p-6 text-center">
                <Award className={`h-8 w-8 mx-auto mb-2 ${stats.streaks.current >= 7 ? 'text-yellow-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">Week Warrior</h3>
                <p className="text-sm text-muted-foreground">Write for 7 consecutive days</p>
                {stats.streaks.current >= 7 && <Badge variant="secondary" className="mt-2">Earned!</Badge>}
              </CardContent>
            </Card>

            <Card className={`${stats.streaks.current >= 30 ? 'border-purple-200 bg-purple-50' : 'opacity-60'}`}>
              <CardContent className="p-6 text-center">
                <Trophy className={`h-8 w-8 mx-auto mb-2 ${stats.streaks.current >= 30 ? 'text-purple-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">Month Master</h3>
                <p className="text-sm text-muted-foreground">Write for 30 consecutive days</p>
                {stats.streaks.current >= 30 && <Badge variant="secondary" className="mt-2">Earned!</Badge>}
              </CardContent>
            </Card>

            <Card className={`${stats.user.stats.totalWordsWritten >= 10000 ? 'border-green-200 bg-green-50' : 'opacity-60'}`}>
              <CardContent className="p-6 text-center">
                <Zap className={`h-8 w-8 mx-auto mb-2 ${stats.user.stats.totalWordsWritten >= 10000 ? 'text-green-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">Word Count Hero</h3>
                <p className="text-sm text-muted-foreground">Write 10,000 total words</p>
                {stats.user.stats.totalWordsWritten >= 10000 && <Badge variant="secondary" className="mt-2">Earned!</Badge>}
              </CardContent>
            </Card>

            <Card className={`${stats.user.stats.totalStoriesPublished >= 1 ? 'border-blue-200 bg-blue-50' : 'opacity-60'}`}>
              <CardContent className="p-6 text-center">
                <BookOpen className={`h-8 w-8 mx-auto mb-2 ${stats.user.stats.totalStoriesPublished >= 1 ? 'text-blue-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">First Publication</h3>
                <p className="text-sm text-muted-foreground">Publish your first story</p>
                {stats.user.stats.totalStoriesPublished >= 1 && <Badge variant="secondary" className="mt-2">Earned!</Badge>}
              </CardContent>
            </Card>

            <Card className={`${stats.user.stats.averageRating >= 4.0 ? 'border-orange-200 bg-orange-50' : 'opacity-60'}`}>
              <CardContent className="p-6 text-center">
                <Target className={`h-8 w-8 mx-auto mb-2 ${stats.user.stats.averageRating >= 4.0 ? 'text-orange-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">Reader's Choice</h3>
                <p className="text-sm text-muted-foreground">Maintain 4+ star average</p>
                {stats.user.stats.averageRating >= 4.0 && <Badge variant="secondary" className="mt-2">Earned!</Badge>}
              </CardContent>
            </Card>

            <Card className={`${stats.monthly.sessions >= 20 ? 'border-red-200 bg-red-50' : 'opacity-60'}`}>
              <CardContent className="p-6 text-center">
                <Calendar className={`h-8 w-8 mx-auto mb-2 ${stats.monthly.sessions >= 20 ? 'text-red-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">Prolific Writer</h3>
                <p className="text-sm text-muted-foreground">20 writing sessions this month</p>
                {stats.monthly.sessions >= 20 && <Badge variant="secondary" className="mt-2">Earned!</Badge>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WritingDashboard