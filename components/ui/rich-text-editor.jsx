'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from './button'
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
  Edit
} from 'lucide-react'

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = '200px'
}) {
  const [content, setContent] = useState(value)
  const [isPreview, setIsPreview] = useState(false)
  const editorRef = useRef(null)

  useEffect(() => {
    setContent(value)
  }, [value])

  const handleChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setContent(newContent)
      onChange?.(newContent)
    }
  }

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleChange()
  }

  const handleKeyDown = (e) => {
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

  const formatButtons = [
    { icon: Bold, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', tooltip: 'Underline (Ctrl+U)' },
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

  const historyButtons = [
    { icon: Undo, command: 'undo', tooltip: 'Undo (Ctrl+Z)' },
    { icon: Redo, command: 'redo', tooltip: 'Redo (Ctrl+Y)' },
  ]

  const renderToolbarGroup = (buttons, groupClass = '') => (
    <div className={cn('flex items-center', groupClass)}>
      {buttons.map(({ icon: Icon, command, value, tooltip }) => (
        <Button
          key={command}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand(command, value)}
          title={tooltip}
          className="h-8 w-8 p-0"
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )

  const convertToMarkdown = (html) => {
    // Simple HTML to markdown conversion for preview
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '_$1_')
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/p><p>/g, '\n\n')
      .replace(/<\/?p>/g, '')
      .replace(/<\/?div>/g, '\n')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '\n')
      .replace(/<ol>/g, '')
      .replace(/<\/ol>/g, '\n')
      .replace(/<li>(.*?)<\/li>/g, '• $1\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  return (
    <div className={cn('border border-border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {renderToolbarGroup(formatButtons)}
            <div className="w-px h-6 bg-border mx-1" />
            {renderToolbarGroup(alignButtons)}
            <div className="w-px h-6 bg-border mx-1" />
            {renderToolbarGroup(listButtons)}
            <div className="w-px h-6 bg-border mx-1" />
            {renderToolbarGroup(historyButtons)}
          </div>

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

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {convertToMarkdown(content) || placeholder}
            </div>
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            className="p-4 focus:outline-none text-foreground leading-relaxed"
            style={{ minHeight }}
            onInput={handleChange}
            onKeyDown={handleKeyDown}
            dangerouslySetInnerHTML={createSanitizedHtml(content, 'editor')}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
            onFocus={(e) => {
              if (!content && e.target.innerHTML === '') {
                e.target.innerHTML = ''
              }
            }}
          />
        )}

        {!content && !isPreview && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Word Count */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} words
      </div>
    </div>
  )
}

// Utility function to strip HTML tags for plain text
export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim()
}

// Utility function to get word count from HTML content
export function getWordCount(html) {
  return stripHtml(html).split(/\s+/).filter(word => word.length > 0).length
}