'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { Textarea } from './textarea'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  Heading,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Eye,
  Edit,
  HelpCircle
} from 'lucide-react'

// Simple markdown to HTML converter
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

export function MarkdownEditor({
  value = '',
  onChange,
  placeholder = 'Start writing in markdown...',
  className,
  minHeight = '300px'
}) {
  const [content, setContent] = useState(value)
  const [isPreview, setIsPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    setContent(value)
  }, [value])

  const handleChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    onChange?.(newContent)
  }

  const insertAtCursor = (before, after = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    const newText =
      content.substring(0, start) +
      before + selectedText + after +
      content.substring(end)

    setContent(newText)
    onChange?.(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertText = (text) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const newText =
      content.substring(0, start) +
      text +
      content.substring(start)

    setContent(newText)
    onChange?.(newText)

    // Position cursor after inserted text
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const toolbarButtons = [
    {
      icon: Bold,
      tooltip: 'Bold',
      action: () => insertAtCursor('**', '**')
    },
    {
      icon: Italic,
      tooltip: 'Italic',
      action: () => insertAtCursor('*', '*')
    },
    {
      icon: Heading,
      tooltip: 'Heading',
      action: () => insertText('\n## ')
    },
    {
      icon: Quote,
      tooltip: 'Quote',
      action: () => insertText('\n> ')
    },
    {
      icon: List,
      tooltip: 'Unordered List',
      action: () => insertText('\n- ')
    },
    {
      icon: ListOrdered,
      tooltip: 'Ordered List',
      action: () => insertText('\n1. ')
    },
    {
      icon: Link,
      tooltip: 'Link',
      action: () => insertAtCursor('[', '](url)')
    },
    {
      icon: Image,
      tooltip: 'Image',
      action: () => insertAtCursor('![alt text](', ')')
    },
    {
      icon: Code,
      tooltip: 'Code',
      action: () => insertAtCursor('`', '`')
    }
  ]

  const markdownHelp = [
    { syntax: '# H1', description: 'Heading 1' },
    { syntax: '## H2', description: 'Heading 2' },
    { syntax: '### H3', description: 'Heading 3' },
    { syntax: '**bold**', description: 'Bold text' },
    { syntax: '*italic*', description: 'Italic text' },
    { syntax: '`code`', description: 'Inline code' },
    { syntax: '```\ncode block\n```', description: 'Code block' },
    { syntax: '[link](url)', description: 'Link' },
    { syntax: '![alt](image.jpg)', description: 'Image' },
    { syntax: '> quote', description: 'Blockquote' },
    { syntax: '- item', description: 'Unordered list' },
    { syntax: '1. item', description: 'Ordered list' }
  ]

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  return (
    <div className={cn('border border-border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
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

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              title="Markdown Help"
              className="h-8 w-8 p-0"
            >
              <HelpCircle className="h-4 w-4" />
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

        {/* Markdown Help Panel */}
        {showHelp && (
          <div className="mt-2 p-3 bg-background border border-border rounded-md">
            <h4 className="font-semibold text-sm mb-2">Markdown Syntax</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {markdownHelp.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <code className="bg-muted px-1 rounded">{item.syntax}</code>
                  <span className="text-muted-foreground">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div
            className="p-4 prose prose-sm max-w-none min-h-[200px] text-foreground"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) || `<p class="text-muted-foreground">${placeholder}</p>` }}
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className="border-0 resize-none focus:ring-0 rounded-none font-mono text-sm leading-relaxed"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span>{getWordCount()} words</span>
          <span>{content.length} characters</span>
        </div>
        <div className="text-xs">
          {isPreview ? 'Preview Mode' : 'Markdown Mode'}
        </div>
      </div>
    </div>
  )
}

// Utility function to convert markdown to HTML
export function markdownToHtml(markdown) {
  return parseMarkdown(markdown)
}

// Utility function to get word count from markdown
export function getWordCount(markdown) {
  if (!markdown) return 0
  return markdown.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Utility function to get plain text from markdown
export function markdownToPlainText(markdown) {
  if (!markdown) return ''
  return markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .replace(/^[\s]*[-\*\+]\s+/gm, '') // Remove unordered list markers
    .replace(/^[\s]*\d+\.\s+/gm, '') // Remove ordered list markers
    .trim()
}