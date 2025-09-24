'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Textarea } from './textarea'
import { Switch } from './switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { cn } from '@/lib/utils'
import { createSanitizedHtml } from '@/lib/sanitize'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Separator,
  Undo,
  Redo,
  Eye,
  Edit,
  Save,
  Clock,
  Calendar,
  Target,
  BarChart3,
  Palette,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Subscript,
  Superscript,
  Indent,
  Outdent,
  Play,
  Pause,
  Timer,
  TrendingUp,
  Settings
} from 'lucide-react'

export function AdvancedChapterEditor({
  chapterTitle = '',
  chapterContent = '',
  chapterNotes = '',
  scheduledDate = '',
  status = 'draft',
  onTitleChange,
  onContentChange,
  onNotesChange,
  onScheduleChange,
  onStatusChange,
  onSave,
  autoSaveEnabled = true,
  autoSaveInterval = 30000,
  showWritingStats = true,
  showScheduler = true,
  className,
  minHeight = '500px'
}) {
  const [title, setTitle] = useState(chapterTitle)
  const [content, setContent] = useState(chapterContent)
  const [notes, setNotes] = useState(chapterNotes)
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Writing statistics
  const [writingSession, setWritingSession] = useState({
    startTime: null,
    totalTime: 0,
    isActive: false,
    wordTarget: 500,
    initialWordCount: 0
  })

  // Scheduling
  const [publishSchedule, setPublishSchedule] = useState({
    enabled: false,
    date: scheduledDate,
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  // Editor settings
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 1.6,
    theme: 'light',
    focusMode: false,
    distractionFree: false
  })

  const editorRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)
  const writingTimerRef = useRef(null)

  // Update local state when props change
  useEffect(() => {
    setTitle(chapterTitle)
    setContent(chapterContent)
    setNotes(chapterNotes)
    setPublishSchedule(prev => ({ ...prev, date: scheduledDate }))
  }, [chapterTitle, chapterContent, chapterNotes, scheduledDate])

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!autoSaveEnabled || !unsavedChanges || !onSave) return

    try {
      setIsSaving(true)
      await onSave({
        title,
        content,
        notes,
        scheduledDate: publishSchedule.enabled ? `${publishSchedule.date}T${publishSchedule.time}` : null,
        status: publishSchedule.enabled ? 'scheduled' : status,
        isDraft: true
      })
      setLastSaved(new Date())
      setUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [title, content, notes, publishSchedule, unsavedChanges, autoSaveEnabled, onSave, status])

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveEnabled && unsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(performAutoSave, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [performAutoSave, autoSaveInterval, autoSaveEnabled, unsavedChanges])

  // Writing session timer
  useEffect(() => {
    if (writingSession.isActive) {
      writingTimerRef.current = setInterval(() => {
        setWritingSession(prev => ({
          ...prev,
          totalTime: prev.totalTime + 1
        }))
      }, 1000)
    } else {
      if (writingTimerRef.current) {
        clearInterval(writingTimerRef.current)
      }
    }

    return () => {
      if (writingTimerRef.current) {
        clearInterval(writingTimerRef.current)
      }
    }
  }, [writingSession.isActive])

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setUnsavedChanges(true)
    onTitleChange?.(newTitle)
  }

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setContent(newContent)
      setUnsavedChanges(true)
      onContentChange?.(newContent)

      // Start writing session if not active
      if (!writingSession.isActive && newContent.trim()) {
        startWritingSession()
      }
    }
  }

  const handleNotesChange = (e) => {
    const newNotes = e.target.value
    setNotes(newNotes)
    setUnsavedChanges(true)
    onNotesChange?.(newNotes)
  }

  const startWritingSession = () => {
    setWritingSession(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      initialWordCount: getWordCount()
    }))
  }

  const pauseWritingSession = () => {
    setWritingSession(prev => ({
      ...prev,
      isActive: false
    }))
  }

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  const insertCustomElement = (elementType) => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      let element

      switch (elementType) {
        case 'pageBreak':
          element = document.createElement('hr')
          element.className = 'page-break'
          element.style.cssText = 'border: none; border-top: 2px dashed #ccc; margin: 2em 0; page-break-after: always;'
          break
        case 'sceneBreak':
          element = document.createElement('div')
          element.className = 'scene-break'
          element.style.cssText = 'text-align: center; margin: 2em 0; font-size: 1.5em;'
          element.innerHTML = '* * *'
          break
        case 'timestamp':
          element = document.createElement('span')
          element.className = 'timestamp'
          element.style.cssText = 'color: #666; font-size: 0.9em;'
          element.innerHTML = new Date().toLocaleString()
          break
      }

      if (element) {
        range.insertNode(element)
        selection.removeAllRanges()
        handleContentChange()
      }
    }
  }

  const formatButtons = [
    { icon: Bold, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', tooltip: 'Underline (Ctrl+U)' },
    { icon: Strikethrough, command: 'strikethrough', tooltip: 'Strikethrough' },
  ]

  const styleButtons = [
    { icon: Heading1, command: 'formatBlock', value: 'h1', tooltip: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', tooltip: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', tooltip: 'Heading 3' },
    { icon: Type, command: 'formatBlock', value: 'p', tooltip: 'Paragraph' },
  ]

  const alignButtons = [
    { icon: AlignLeft, command: 'justifyLeft', tooltip: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', tooltip: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', tooltip: 'Align Right' },
    { icon: AlignJustify, command: 'justifyFull', tooltip: 'Justify' },
  ]

  const listButtons = [
    { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
    { icon: Code, command: 'formatBlock', value: 'pre', tooltip: 'Code Block' },
  ]

  const insertButtons = [
    { icon: Separator, action: () => insertCustomElement('pageBreak'), tooltip: 'Page Break' },
    { icon: Calendar, action: () => insertCustomElement('timestamp'), tooltip: 'Insert Timestamp' },
  ]

  const indentButtons = [
    { icon: Indent, command: 'indent', tooltip: 'Increase Indent' },
    { icon: Outdent, command: 'outdent', tooltip: 'Decrease Indent' },
  ]

  const historyButtons = [
    { icon: Undo, command: 'undo', tooltip: 'Undo (Ctrl+Z)' },
    { icon: Redo, command: 'redo', tooltip: 'Redo (Ctrl+Y)' },
  ]

  const renderToolbarGroup = (buttons, groupClass = '') => (
    <div className={cn('flex items-center', groupClass)}>
      {buttons.map(({ icon: Icon, command, value, action, tooltip }, index) => (
        <Button
          key={index}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => action ? action() : executeCommand(command, value)}
          title={tooltip}
          className="h-8 w-8 p-0"
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )

  const getWordCount = () => {
    return content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
  }

  const getReadingTime = () => {
    return Math.ceil(getWordCount() / 200)
  }

  const getWritingProgress = () => {
    const currentWords = getWordCount()
    const wordsWritten = currentWords - writingSession.initialWordCount
    const progressPercentage = writingSession.wordTarget > 0 ? (wordsWritten / writingSession.wordTarget) * 100 : 0
    return { currentWords, wordsWritten, progressPercentage: Math.min(progressPercentage, 100) }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never'
    const now = new Date()
    const diff = now - lastSaved
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    return `${hours} hours ago`
  }

  const handleScheduleChange = (field, value) => {
    setPublishSchedule(prev => {
      const newSchedule = { ...prev, [field]: value }
      onScheduleChange?.(newSchedule)
      return newSchedule
    })
    setUnsavedChanges(true)
  }

  const { currentWords, wordsWritten, progressPercentage } = getWritingProgress()

  return (
    <div className={cn('space-y-4', className)}>
      {/* Writing Statistics Panel (if enabled) */}
      {showWritingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{currentWords}</div>
            <div className="text-xs text-muted-foreground">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+{wordsWritten}</div>
            <div className="text-xs text-muted-foreground">Words Written</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatTime(writingSession.totalTime)}</div>
            <div className="text-xs text-muted-foreground">Writing Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-muted-foreground">
              Goal Progress ({writingSession.wordTarget} words)
            </div>
          </div>
        </div>
      )}

      {/* Chapter Title */}
      <div className="space-y-2">
        <Label htmlFor="chapter-title" className="text-sm font-medium">
          Chapter Title
        </Label>
        <Input
          id="chapter-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter chapter title..."
          className="text-lg font-semibold"
        />
      </div>

      {/* Publishing Schedule (if enabled) */}
      {showScheduler && (
        <div className="p-4 border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="schedule-enabled" className="text-sm font-medium">
              Schedule Publication
            </Label>
            <Switch
              id="schedule-enabled"
              checked={publishSchedule.enabled}
              onCheckedChange={(checked) => handleScheduleChange('enabled', checked)}
            />
          </div>

          {publishSchedule.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Publication Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={publishSchedule.date}
                  onChange={(e) => handleScheduleChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Publication Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={publishSchedule.time}
                  onChange={(e) => handleScheduleChange('time', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Container */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Advanced Toolbar */}
        <div className="border-b border-border bg-muted/30 p-2 space-y-2">
          {/* Main Formatting Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center flex-wrap gap-1">
              {renderToolbarGroup(formatButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(styleButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(alignButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(listButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(indentButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(insertButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(historyButtons)}
            </div>

            <div className="flex items-center gap-2">
              {/* Writing Timer Controls */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={writingSession.isActive ? pauseWritingSession : startWritingSession}
                className="flex items-center gap-1"
              >
                {writingSession.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="text-xs">{formatTime(writingSession.totalTime)}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center gap-2"
              >
                {isPreview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>

          {/* Word Target Row */}
          <div className="flex items-center gap-4 text-sm">
            <Label htmlFor="word-target" className="whitespace-nowrap">Word Target:</Label>
            <Input
              id="word-target"
              type="number"
              value={writingSession.wordTarget}
              onChange={(e) => setWritingSession(prev => ({ ...prev, wordTarget: parseInt(e.target.value) || 0 }))}
              className="w-20 h-6 text-xs"
              min="0"
            />
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{wordsWritten} / {writingSession.wordTarget}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editor/Preview Area */}
        <div className="relative">
          {isPreview ? (
            <div className="p-6 prose prose-lg max-w-none">
              <h1 className="text-2xl font-bold mb-6">{title || 'Untitled Chapter'}</h1>
              <div
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={createSanitizedHtml(content || '<p>No content yet...</p>', 'display')}
              />
              {notes && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold mb-2">Author's Notes</h3>
                  <p className="text-muted-foreground">{notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable
              className={cn(
                'p-6 focus:outline-none text-foreground leading-relaxed prose prose-lg max-w-none',
                editorSettings.focusMode && 'bg-muted/5'
              )}
              style={{
                minHeight,
                fontSize: `${editorSettings.fontSize}px`,
                fontFamily: editorSettings.fontFamily === 'serif' ? 'Georgia, serif' :
                           editorSettings.fontFamily === 'sans' ? 'Arial, sans-serif' : 'monospace',
                lineHeight: editorSettings.lineHeight
              }}
              onInput={handleContentChange}
              dangerouslySetInnerHTML={createSanitizedHtml(content, 'editor')}
              suppressContentEditableWarning={true}
              data-placeholder="Start writing your chapter..."
            />
          )}

          {!content && !isPreview && (
            <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
              Start writing your chapter...
            </div>
          )}
        </div>

        {/* Author's Notes */}
        {!isPreview && (
          <div className="border-t border-border p-4 bg-muted/20">
            <Label htmlFor="author-notes" className="text-sm font-medium mb-2 block">
              Author's Notes (Optional)
            </Label>
            <Textarea
              id="author-notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add any notes for your readers..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {notes.length}/500 characters
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{getWordCount()} words</span>
            <span>{getReadingTime()} min read</span>
            {writingSession.isActive && (
              <span className="text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Writing...
              </span>
            )}
            {unsavedChanges && (
              <span className="text-orange-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {autoSaveEnabled && (
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Save className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span>Last saved: {formatLastSaved()}</span>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={performAutoSave}
              disabled={!unsavedChanges || isSaving}
              className="h-6 px-2"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedChapterEditor