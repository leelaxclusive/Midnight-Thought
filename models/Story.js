import mongoose from 'mongoose'

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Slug cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cover: {
    type: String,
    default: ''
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: [
      'Romance', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
      'Horror', 'Adventure', 'Young Adult', 'Drama', 'Comedy',
      'Historical Fiction', 'Contemporary', 'Paranormal', 'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'ongoing', 'completed', 'hiatus'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  language: {
    type: String,
    default: 'English'
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  saves: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: [500, 'Reply cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Reviews and Ratings System
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Review content cannot exceed 2000 characters']
    },
    helpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isHelpful: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Rating Statistics
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  views: {
    type: Number,
    default: 0
  },
  totalWords: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Methods for reviews and ratings
storySchema.methods.addReview = function(userId, rating, title, content) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(
    review => review.user.toString() === userId.toString()
  )

  if (existingReview) {
    // Update existing review
    existingReview.rating = rating
    existingReview.title = title
    existingReview.content = content
    existingReview.updatedAt = new Date()
  } else {
    // Add new review
    this.reviews.push({
      user: userId,
      rating,
      title,
      content
    })
  }

  this.updateRatingStats()
  return this.save()
}

storySchema.methods.removeReview = function(userId) {
  const reviewIndex = this.reviews.findIndex(
    review => review.user.toString() === userId.toString()
  )

  if (reviewIndex > -1) {
    this.reviews.splice(reviewIndex, 1)
    this.updateRatingStats()
    return this.save()
  }
  return Promise.resolve(false)
}

storySchema.methods.updateRatingStats = function() {
  const reviews = this.reviews

  if (reviews.length === 0) {
    this.rating = {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
    return
  }

  // Calculate average
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const average = totalRating / reviews.length

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach(review => {
    distribution[review.rating]++
  })

  this.rating = {
    average: Math.round(average * 10) / 10, // Round to 1 decimal place
    count: reviews.length,
    distribution
  }
}

storySchema.methods.getUserReview = function(userId) {
  return this.reviews.find(
    review => review.user.toString() === userId.toString()
  )
}

storySchema.methods.markReviewHelpful = function(reviewId, userId, isHelpful = true) {
  const review = this.reviews.id(reviewId)
  if (!review) return Promise.resolve(false)

  // Remove existing helpful vote from this user
  review.helpful = review.helpful.filter(
    h => h.user.toString() !== userId.toString()
  )

  // Add new vote
  review.helpful.push({
    user: userId,
    isHelpful
  })

  return this.save()
}

// Pre-save middleware to generate slug and update ratings
storySchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100)
  }

  // Update rating stats if reviews were modified
  if (this.isModified('reviews')) {
    this.updateRatingStats()
  }

  next()
})

// Performance and Security Indexes
storySchema.index({ slug: 1 }, { unique: true }) // Unique constraint for URL safety
storySchema.index({ author: 1 })
storySchema.index({ genre: 1 })
storySchema.index({ status: 1 })
storySchema.index({ visibility: 1 })
storySchema.index({ featured: 1 })
storySchema.index({ createdAt: -1 })
storySchema.index({ views: -1 })
storySchema.index({ totalWords: -1 })

// Compound indexes for common query patterns
storySchema.index({ visibility: 1, status: 1 }) // Public stories filter
storySchema.index({ author: 1, status: 1 }) // Author's stories by status
storySchema.index({ genre: 1, visibility: 1, status: 1 }) // Genre browsing
storySchema.index({ featured: 1, visibility: 1, status: 1 }) // Featured stories
storySchema.index({ visibility: 1, status: 1, createdAt: -1 }) // Recent public stories
storySchema.index({ visibility: 1, status: 1, views: -1 }) // Popular stories
storySchema.index({ author: 1, visibility: 1, status: 1 }) // Author public stories

// Full-text search indexes
storySchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,    // Title most important
    description: 5,
    tags: 2
  },
  name: 'story_search_index'
})

// Performance indexes for likes and saves arrays
storySchema.index({ 'likes.user': 1 }) // User likes lookup
storySchema.index({ 'saves.user': 1 }) // User saves lookup
storySchema.index({ 'likes.createdAt': -1 }) // Recent likes
storySchema.index({ 'saves.createdAt': -1 }) // Recent saves

// Comment system indexes
storySchema.index({ 'comments.user': 1 }) // User comments
storySchema.index({ 'comments.createdAt': -1 }) // Recent comments

// Reviews and ratings indexes
storySchema.index({ 'reviews.user': 1 }) // User reviews lookup
storySchema.index({ 'reviews.rating': -1 }) // Reviews by rating
storySchema.index({ 'reviews.createdAt': -1 }) // Recent reviews
storySchema.index({ 'rating.average': -1 }) // Stories by rating
storySchema.index({ 'rating.count': -1 }) // Stories by review count
storySchema.index({ 'reviews.helpful.user': 1 }) // Review helpfulness votes

export default mongoose.models.Story || mongoose.model('Story', storySchema)