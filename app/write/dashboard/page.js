'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { WritingDashboard } from '@/components/ui/writing-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PenTool, Plus, BookOpen, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function WritingDashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Writing Dashboard</h1>
          <p className="text-muted-foreground">
            Track your writing progress, set goals, and stay motivated
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/write">
            <Button>
              <PenTool className="h-4 w-4 mr-2" />
              Start Writing
            </Button>
          </Link>
          <Link href="/write/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Story
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link href="/write/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Create New Story</h3>
                  <p className="text-sm text-muted-foreground">Start a fresh writing project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/stories">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">My Stories</h3>
                  <p className="text-sm text-muted-foreground">Manage your published works</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Author Profile</h3>
                  <p className="text-sm text-muted-foreground">View your public profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Writing Dashboard */}
      <WritingDashboard />
    </div>
  )
}