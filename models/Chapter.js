import mongoose from 'mongoose'

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Chapter content is required']
  },
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chapterNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'private'],
    default: 'draft'
  },
  scheduledPublishDate: {
    type: Date,
    default: null
  },
  timezone: {
    type: String,
    default: null
  },
  wordCount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
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
    paragraph: {
      type: Number,
      default: null
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
  views: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0
  },
  // Analytics tracking
  analytics: {
    totalReadTime: { type: Number, default: 0 }, // Total time spent reading (in seconds)
    averageReadTime: { type: Number, default: 0 }, // Average time per reader
    completionRate: { type: Number, default: 0 }, // Percentage who finished reading
    uniqueReaders: { type: Number, default: 0 }, // Number of unique readers
    readingSessions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sessionId: String,
      startTime: Date,
      endTime: Date,
      timeSpent: Number, // in seconds
      completed: { type: Boolean, default: false },
      scrollProgress: { type: Number, default: 0 }, // percentage of content scrolled
      createdAt: { type: Date, default: Date.now }
    }]
  },
  // Auto-save draft support
  draft: {
    content: String,
    title: String,
    lastSaved: Date,
    autoSaveEnabled: { type: Boolean, default: true }
  },
  // Previous/Next navigation support
  previousChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  },
  nextChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  },
  // Writing sessions for this chapter
  writingSessions: [{
    date: { type: Date, required: true },
    wordsWritten: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // in seconds
    sessions: { type: Number, default: 1 },
    startWordCount: { type: Number, default: 0 },
    endWordCount: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
})

chapterSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Strip HTML tags to get plain text for word counting
    const plainText = this.content.replace(/<[^>]*>/g, '').trim()
    this.wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length
    this.readingTime = Math.ceil(this.wordCount / 200)
  }
  next()
})

// Methods for analytics
chapterSchema.methods.startReadingSession = function(userId, sessionId) {
  if (!this.analytics) this.analytics = { readingSessions: [] }

  this.analytics.readingSessions.push({
    userId,
    sessionId,
    startTime: new Date(),
    timeSpent: 0,
    completed: false,
    scrollProgress: 0
  })

  return this.save()
}

chapterSchema.methods.updateReadingSession = function(sessionId, timeSpent, scrollProgress, completed = false) {
  if (!this.analytics?.readingSessions) return Promise.resolve(this)

  const session = this.analytics.readingSessions.find(s => s.sessionId === sessionId)
  if (session) {
    session.timeSpent = timeSpent
    session.scrollProgress = scrollProgress
    session.completed = completed
    session.endTime = new Date()
  }

  this.updateAnalytics()
  return this.save()
}

chapterSchema.methods.updateAnalytics = function() {
  if (!this.analytics?.readingSessions?.length) return

  const sessions = this.analytics.readingSessions
  const completedSessions = sessions.filter(s => s.completed)

  // Calculate analytics
  this.analytics.totalReadTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
  this.analytics.uniqueReaders = new Set(sessions.map(s => s.userId?.toString())).size
  this.analytics.completionRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0
  this.analytics.averageReadTime = sessions.length > 0 ? this.analytics.totalReadTime / sessions.length : 0
}

// Methods for navigation
chapterSchema.statics.updateChapterNavigation = async function(storyId) {
  const chapters = await this.find({
    story: storyId,
    status: { $in: ['published', 'scheduled'] }
  }).sort({ chapterNumber: 1 })

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    const prevChapter = i > 0 ? chapters[i - 1] : null
    const nextChapter = i < chapters.length - 1 ? chapters[i + 1] : null

    await this.findByIdAndUpdate(chapter._id, {
      previousChapter: prevChapter?._id || null,
      nextChapter: nextChapter?._id || null
    })
  }
}

// Performance and Security Indexes
chapterSchema.index({ story: 1, chapterNumber: 1 }, { unique: true }) // Ensure unique chapter numbers per story
chapterSchema.index({ author: 1 })
chapterSchema.index({ status: 1 })
chapterSchema.index({ createdAt: -1 })

// Compound indexes for common query patterns
chapterSchema.index({ story: 1, status: 1 }) // Story chapters by status
chapterSchema.index({ author: 1, status: 1 }) // Author chapters by status
chapterSchema.index({ story: 1, status: 1, chapterNumber: 1 }) // Published chapters ordered
chapterSchema.index({ story: 1, status: 1, createdAt: -1 }) // Recent story chapters
chapterSchema.index({ status: 1, createdAt: -1 }) // Recent published chapters
chapterSchema.index({ status: 1, views: -1 }) // Popular chapters

// Performance indexes
chapterSchema.index({ views: -1 }) // Most viewed chapters
chapterSchema.index({ wordCount: -1 }) // Longest chapters
chapterSchema.index({ scheduledPublishDate: 1 }) // Scheduled publishing
chapterSchema.index({ 'writingSessions.date': -1 }) // Writing session tracking

// Comment and interaction indexes
chapterSchema.index({ 'likes.user': 1 }) // User likes lookup
chapterSchema.index({ 'likes.createdAt': -1 }) // Recent likes
chapterSchema.index({ 'comments.user': 1 }) // User comments
chapterSchema.index({ 'comments.createdAt': -1 }) // Recent comments

// Full-text search for chapter content (limited to title only for performance)
chapterSchema.index({ title: 'text' }, { name: 'chapter_title_search' })

// Analytics indexes
chapterSchema.index({ 'analytics.readingSessions.userId': 1 })
chapterSchema.index({ 'analytics.readingSessions.createdAt': -1 })
chapterSchema.index({ 'analytics.completionRate': -1 })
chapterSchema.index({ 'analytics.averageReadTime': -1 })

// Navigation indexes
chapterSchema.index({ previousChapter: 1 })
chapterSchema.index({ nextChapter: 1 })

// Draft management
chapterSchema.index({ 'draft.lastSaved': -1 })

export default mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema)