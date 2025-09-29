'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  Underline,
  Heading,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'

// Convert HTML back to markdown (reverse conversion)
const htmlToMarkdown = (html) => {
  if (!html) return ''

  let markdown = html
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')

    // Strong/Bold
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')

    // Emphasis/Italic
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // Code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n')

    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

    // Images
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)')

    // Blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
      return '> ' + content.replace(/<[^>]*>/g, '').trim() + '\n\n'
    })

    // Lists
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n'
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n'
    })

    // Line breaks and paragraphs
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p><p[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n')

    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')

    // Clean up HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

    // Clean up extra whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return markdown
}

// Convert markdown to HTML (from our existing function)
const parseMarkdown = (markdown) => {
  if (!markdown) return ''

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code inline
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // Code blocks
    .replace(/```(.*?)```/gs, '<pre class="bg-muted p-3 rounded-md overflow-x-auto"><code>$1</code></pre>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-md" />')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-border pl-4 py-2 bg-muted/30">$1</blockquote>')
    // Unordered lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>')

  // Wrap consecutive <li> elements in proper list tags
  html = html.replace(/(<li>.*?<\/li>)(?:\s*<br>\s*<li>.*?<\/li>)*/g, (match) => {
    const items = match.split('<br>').filter(item => item.trim())
    if (items.some(item => item.includes('•') || /^\d+\./.test(item.replace(/<\/?li>/g, '')))) {
      return `<ul class="list-disc list-inside space-y-1 my-2">${items.join('')}</ul>`
    } else {
      return `<ol class="list-decimal list-inside space-y-1 my-2">${items.join('')}</ol>`
    }
  })

  return html
}

export function VisualMarkdownEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = '300px'
}) {
  const [content, setContent] = useState(value)
  const [isEditing, setIsEditing] = useState(false)
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && value !== content) {
      editorRef.current.innerHTML = parseMarkdown(value)
      setContent(value)
    }
  }, [value])

  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML
      const markdownContent = htmlToMarkdown(htmlContent)
      setContent(markdownContent)
      onChange?.(markdownContent)
    }
  }

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  const insertMarkdown = (before, after = '') => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()

      // Create markdown text
      const markdownText = before + selectedText + after

      // Insert the markdown text
      range.deleteContents()
      const textNode = document.createTextNode(markdownText)
      range.insertNode(textNode)

      // Update content
      handleContentChange()
    }
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

  const handleFocus = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  const toolbarButtons = [
    {
      icon: Bold,
      tooltip: 'Bold (Ctrl+B)',
      action: () => executeCommand('bold')
    },
    {
      icon: Italic,
      tooltip: 'Italic (Ctrl+I)',
      action: () => executeCommand('italic')
    },
    {
      icon: Underline,
      tooltip: 'Underline (Ctrl+U)',
      action: () => executeCommand('underline')
    },
    {
      icon: Heading,
      tooltip: 'Heading',
      action: () => executeCommand('formatBlock', 'h2')
    },
    {
      icon: Quote,
      tooltip: 'Quote',
      action: () => executeCommand('formatBlock', 'blockquote')
    },
    {
      icon: List,
      tooltip: 'Bullet List',
      action: () => executeCommand('insertUnorderedList')
    },
    {
      icon: ListOrdered,
      tooltip: 'Numbered List',
      action: () => executeCommand('insertOrderedList')
    },
    {
      icon: Code,
      tooltip: 'Code',
      action: () => insertMarkdown('`', '`')
    },
    {
      icon: Link,
      tooltip: 'Link',
      action: () => {
        const url = prompt('Enter URL:')
        if (url) executeCommand('createLink', url)
      }
    },
    {
      icon: AlignLeft,
      tooltip: 'Align Left',
      action: () => executeCommand('justifyLeft')
    },
    {
      icon: AlignCenter,
      tooltip: 'Align Center',
      action: () => executeCommand('justifyCenter')
    },
    {
      icon: AlignRight,
      tooltip: 'Align Right',
      action: () => executeCommand('justifyRight')
    },
    {
      icon: Undo,
      tooltip: 'Undo (Ctrl+Z)',
      action: () => executeCommand('undo')
    },
    {
      icon: Redo,
      tooltip: 'Redo (Ctrl+Y)',
      action: () => executeCommand('redo')
    }
  ]

  return (
    <div className={cn('border border-border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarButtons.map(({ icon: Icon, tooltip, action }, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={action}
              title={tooltip}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className="p-4 focus:outline-none text-foreground leading-relaxed prose dark:prose-invert max-w-none"
          style={{ minHeight }}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          suppressContentEditableWarning={true}
        />

        {!content && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        Visual Editor • {content.split(/\s+/).filter(word => word.length > 0).length} words
      </div>
    </div>
  )
}

// Export utility functions
export { htmlToMarkdown, parseMarkdown }