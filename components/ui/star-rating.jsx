'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({
  rating = 0,
  onChange,
  readonly = false,
  size = 'default',
  showValue = true,
  className
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizes = {
    small: 'h-4 w-4',
    default: 'h-5 w-5',
    large: 'h-6 w-6'
  }

  const handleClick = (value) => {
    if (!readonly && onChange) {
      onChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              'transition-colors',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          >
            <Star
              className={cn(
                sizes[size],
                'transition-colors',
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>

      {showValue && (
        <span className="text-sm text-muted-foreground">
          {displayRating > 0 ? displayRating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

export function StarDisplay({ rating = 0, count = 0, size = 'default', className }) {
  const sizes = {
    small: 'h-3 w-3',
    default: 'h-4 w-4',
    large: 'h-5 w-5'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizes[size],
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} {count > 0 && `(${count})`}
      </span>
    </div>
  )
}

export default StarRating