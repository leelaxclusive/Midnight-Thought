'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './button'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { createSanitizedHtml } from '@/lib/sanitize'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Eye,
  Edit,
  Save,
  Clock,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Separator
} from 'lucide-react'

export function ChapterEditor({
  chapterTitle = '',
  chapterContent = '',
  onTitleChange,
  onContentChange,
  onSave,
  autoSaveEnabled = true,
  autoSaveInterval = 30000, // 30 seconds
  className,
  minHeight = '400px'
}) {
  const [title, setTitle] = useState(chapterTitle)
  const [content, setContent] = useState(chapterContent)
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const editorRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)

  // Update local state when props change
  useEffect(() => {
    setTitle(chapterTitle)
    setContent(chapterContent)
  }, [chapterTitle, chapterContent])

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!autoSaveEnabled || !unsavedChanges || !onSave) return

    try {
      setIsSaving(true)
      await onSave({ title, content, isDraft: true })
      setLastSaved(new Date())
      setUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [title, content, unsavedChanges, autoSaveEnabled, onSave])

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
    }
  }

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  const handleKeyDown = (e) => {
    // Auto-save on Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      performAutoSave()
      return
    }

    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          executeCommand('bold')
          break
        case 'i':
          e.preventDefault()
          executeCommand('italic')
          break
        case 'u':
          e.preventDefault()
          executeCommand('underline')
          break
        case 'z':
          e.preventDefault()
          executeCommand('undo')
          break
        case 'y':
          e.preventDefault()
          executeCommand('redo')
          break
      }
    }
  }

  const insertHeading = (level) => {
    executeCommand('formatBlock', `h${level}`)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      executeCommand('createLink', url)
    }
  }

  const insertHorizontalRule = () => {
    executeCommand('insertHorizontalRule')
  }

  const formatButtons = [
    { icon: Bold, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', tooltip: 'Underline (Ctrl+U)' },
  ]

  const headingButtons = [
    { icon: Heading1, action: () => insertHeading(1), tooltip: 'Heading 1' },
    { icon: Heading2, action: () => insertHeading(2), tooltip: 'Heading 2' },
    { icon: Heading3, action: () => insertHeading(3), tooltip: 'Heading 3' },
  ]

  const alignButtons = [
    { icon: AlignLeft, command: 'justifyLeft', tooltip: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', tooltip: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', tooltip: 'Align Right' },
  ]

  const listButtons = [
    { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
  ]

  const insertButtons = [
    { icon: Link, action: insertLink, tooltip: 'Insert Link' },
    { icon: Separator, action: insertHorizontalRule, tooltip: 'Horizontal Rule' },
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

  return (
    <div className={cn('space-y-4', className)}>
      {/* Chapter Title */}
      <div className="space-y-2">
        <label htmlFor="chapter-title" className="text-sm font-medium">
          Chapter Title
        </label>
        <Input
          id="chapter-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter chapter title..."
          className="text-lg font-semibold"
        />
      </div>

      {/* Editor Container */}
      <div className="border border-border rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border bg-muted/30 p-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center flex-wrap gap-1">
              {renderToolbarGroup(formatButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(headingButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(alignButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(listButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(insertButtons)}
              <div className="w-px h-6 bg-border mx-1" />
              {renderToolbarGroup(historyButtons)}
            </div>

            <div className="flex items-center gap-2">
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
        </div>

        {/* Editor/Preview Area */}
        <div className="relative">
          {isPreview ? (
            <div className="p-6 prose prose-lg max-w-none">
              <h1 className="text-2xl font-bold mb-4">{title || 'Untitled Chapter'}</h1>
              <div
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={createSanitizedHtml(content || '<p>No content yet...</p>', 'display')}
              />
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable
              className="p-6 focus:outline-none text-foreground leading-relaxed prose prose-lg max-w-none"
              style={{ minHeight }}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              dangerouslySetInnerHTML={createSanitizedHtml(content, 'editor')}
              suppressContentEditableWarning={true}
              data-placeholder="Start writing your chapter..."
              onFocus={(e) => {
                if (!content && e.target.innerHTML === '') {
                  e.target.innerHTML = '<p><br></p>'
                }
              }}
            />
          )}

          {!content && !isPreview && (
            <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
              Start writing your chapter...
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{getWordCount()} words</span>
            <span>{getReadingTime()} min read</span>
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

// Utility functions
export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function getWordCount(html) {
  return stripHtml(html).split(/\s+/).filter(word => word.length > 0).length
}

export function getReadingTime(html) {
  return Math.ceil(getWordCount(html) / 200)
}