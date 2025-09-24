import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: function() {
				// Password is only required for credentials auth, not social logins
				return !this.emailVerified
			},
			minlength: [6, "Password must be at least 6 characters"],
		},
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			trim: true,
			minlength: [3, "Username must be at least 3 characters"],
			maxlength: [20, "Username cannot exceed 20 characters"],
		},
		bio: {
			type: String,
			maxlength: [500, "Bio cannot exceed 500 characters"],
			default: "",
		},
		avatar: {
			type: String,
			default: "",
		},
		cover: {
			type: String,
			default: "",
		},
		website: {
			type: String,
			default: "",
		},
		location: {
			type: String,
			default: "",
		},
		// Enhanced profile information
		socialLinks: {
			twitter: { type: String, default: "" },
			instagram: { type: String, default: "" },
			facebook: { type: String, default: "" },
			youtube: { type: String, default: "" },
			tiktok: { type: String, default: "" },
			discord: { type: String, default: "" },
			goodreads: { type: String, default: "" },
			wattpad: { type: String, default: "" }
		},
		authorInfo: {
			pseudonym: { type: String, default: "" }, // Author pen name
			genres: [{ type: String }], // Preferred writing genres
			writingExperience: {
				type: String,
				enum: ["beginner", "intermediate", "experienced", "professional"],
				default: "beginner"
			},
			achievements: [{
				title: String,
				description: String,
				icon: String,
				earnedAt: { type: Date, default: Date.now }
			}],
			writingGoals: {
				dailyWordTarget: { type: Number, default: 0 },
				monthlyChapterTarget: { type: Number, default: 0 },
				currentStreak: { type: Number, default: 0 },
				longestStreak: { type: Number, default: 0 },
				lastWritingDate: { type: Date }
			}
		},
		stats: {
			totalWordsWritten: { type: Number, default: 0 },
			totalStoriesPublished: { type: Number, default: 0 },
			totalChaptersPublished: { type: Number, default: 0 },
			totalViews: { type: Number, default: 0 },
			totalLikes: { type: Number, default: 0 },
			totalComments: { type: Number, default: 0 },
			averageRating: { type: Number, default: 0 },
			totalReviews: { type: Number, default: 0 },
			joinedChallenges: { type: Number, default: 0 },
			completedChallenges: { type: Number, default: 0 }
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		role: {
			type: String,
			enum: ["reader", "writers", "author", "admin"],
			default: "reader",
		},
		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		savedStories: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Story",
			},
		],
		readingProgress: [
			{
				story: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Story",
				},
				lastChapter: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Chapter",
				},
				chapterNumber: {
					type: Number,
					default: 1
				},
				progress: {
					type: Number,
					default: 0, // Percentage of story completed
				},
				scrollPosition: {
					type: Number,
					default: 0, // Scroll position in current chapter
				},
				totalTimeRead: {
					type: Number,
					default: 0, // Total time spent reading this story (seconds)
				},
				lastRead: {
					type: Date,
					default: Date.now,
				},
				isCompleted: {
					type: Boolean,
					default: false
				}
			},
		],
		readingHistory: [
			{
				story: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Story",
					required: true
				},
				rating: {
					type: Number,
					min: 0,
					max: 5,
					default: 0
				},
				review: {
					type: String,
					maxlength: [1000, "Review cannot exceed 1000 characters"],
					default: ""
				},
				completedAt: {
					type: Date,
					default: Date.now
				}
			}
		],
		// Reading Lists/Collections
		readingLists: [
			{
				name: {
					type: String,
					required: true,
					maxlength: [50, "List name cannot exceed 50 characters"]
				},
				description: {
					type: String,
					maxlength: [200, "List description cannot exceed 200 characters"],
					default: ""
				},
				isPublic: {
					type: Boolean,
					default: false
				},
				stories: [{
					type: mongoose.Schema.Types.ObjectId,
					ref: "Story"
				}],
				createdAt: {
					type: Date,
					default: Date.now
				},
				updatedAt: {
					type: Date,
					default: Date.now
				}
			}
		],
		// Notification Settings
		notificationSettings: {
			email: {
				newChapters: { type: Boolean, default: true },
				newFollowers: { type: Boolean, default: true },
				storyUpdates: { type: Boolean, default: true },
				mentions: { type: Boolean, default: true }
			},
			discord: {
				enabled: { type: Boolean, default: false },
				webhookUrl: { type: String, default: "" },
				newChapters: { type: Boolean, default: false },
				milestones: { type: Boolean, default: false }
			},
			telegram: {
				enabled: { type: Boolean, default: false },
				botToken: { type: String, default: "" },
				chatId: { type: String, default: "" },
				newChapters: { type: Boolean, default: false },
				milestones: { type: Boolean, default: false }
			}
		},
		emailVerified: {
			type: Date,
			default: null,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		// Security fields for authentication
		loginAttempts: {
			type: Number,
			default: 0,
		},
		lockUntil: {
			type: Date,
		},
		lastLogin: {
			type: Date,
		},
		passwordResetToken: {
			type: String,
			select: false,
		},
		passwordResetExpires: {
			type: Date,
			select: false,
		},
		// Social authentication fields
		authProvider: {
			type: String,
			enum: ['credentials', 'google', 'facebook', 'reddit'],
			default: 'credentials'
		},
		providerId: {
			type: String,
			sparse: true // Allows multiple null values while maintaining uniqueness for non-null values
		},
		providerAccountId: {
			type: String,
			sparse: true
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre("save", async function (next) {
	// Only hash password if it exists and is modified (for credentials auth)
	if (!this.password || !this.isModified("password")) return next();

	try {
		const saltRounds = 12;
		this.password = await bcrypt.hash(this.password, saltRounds);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

// Methods for following system
userSchema.methods.follow = async function(userId) {
	if (!this.following.includes(userId)) {
		this.following.push(userId)
		await this.save()

		// Add this user to the target user's followers
		await mongoose.model('User').findByIdAndUpdate(userId, {
			$addToSet: { followers: this._id }
		})

		return true
	}
	return false
}

userSchema.methods.unfollow = async function(userId) {
	const index = this.following.indexOf(userId)
	if (index > -1) {
		this.following.splice(index, 1)
		await this.save()

		// Remove this user from the target user's followers
		await mongoose.model('User').findByIdAndUpdate(userId, {
			$pull: { followers: this._id }
		})

		return true
	}
	return false
}

userSchema.methods.isFollowing = function(userId) {
	return this.following.includes(userId)
}

// Methods for reading progress
userSchema.methods.updateReadingProgress = function(storyId, chapterRef, chapterNumber, scrollPosition = 0, timeSpent = 0) {
	const existingProgress = this.readingProgress.find(
		progress => progress.story.toString() === storyId.toString()
	)

	if (existingProgress) {
		existingProgress.lastChapter = chapterRef
		existingProgress.chapterNumber = chapterNumber
		existingProgress.scrollPosition = scrollPosition
		existingProgress.totalTimeRead += timeSpent
		existingProgress.lastRead = new Date()
	} else {
		this.readingProgress.push({
			story: storyId,
			lastChapter: chapterRef,
			chapterNumber,
			scrollPosition,
			totalTimeRead: timeSpent,
			lastRead: new Date()
		})
	}

	return this.save()
}

userSchema.methods.getReadingProgress = function(storyId) {
	return this.readingProgress.find(
		progress => progress.story.toString() === storyId.toString()
	)
}

// Methods for reading lists
userSchema.methods.createReadingList = function(name, description = "", isPublic = false) {
	this.readingLists.push({
		name,
		description,
		isPublic,
		stories: []
	})
	return this.save()
}

userSchema.methods.addToReadingList = function(listId, storyId) {
	const list = this.readingLists.id(listId)
	if (list && !list.stories.includes(storyId)) {
		list.stories.push(storyId)
		list.updatedAt = new Date()
		return this.save()
	}
	return Promise.resolve(false)
}

userSchema.methods.removeFromReadingList = function(listId, storyId) {
	const list = this.readingLists.id(listId)
	if (list) {
		const index = list.stories.indexOf(storyId)
		if (index > -1) {
			list.stories.splice(index, 1)
			list.updatedAt = new Date()
			return this.save()
		}
	}
	return Promise.resolve(false)
}

// Methods for updating author statistics
userSchema.methods.updateStats = async function() {
	const Story = mongoose.model('Story')
	const Chapter = mongoose.model('Chapter')

	// Get user's stories
	const stories = await Story.find({ author: this._id })

	// Calculate stats
	const totalStoriesPublished = stories.filter(s => s.status !== 'draft').length
	const totalViews = stories.reduce((sum, story) => sum + (story.views || 0), 0)
	const totalLikes = stories.reduce((sum, story) => sum + (story.likes?.length || 0), 0)
	const totalComments = stories.reduce((sum, story) => sum + (story.comments?.length || 0), 0)
	const totalReviews = stories.reduce((sum, story) => sum + (story.reviews?.length || 0), 0)

	// Calculate average rating
	const allRatings = stories.map(s => s.rating?.average || 0).filter(r => r > 0)
	const averageRating = allRatings.length > 0 ?
		allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0

	// Get chapters
	const chapters = await Chapter.find({ author: this._id, status: 'published' })
	const totalChaptersPublished = chapters.length
	const totalWordsWritten = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)

	// Update stats
	this.stats = {
		...this.stats,
		totalStoriesPublished,
		totalChaptersPublished,
		totalViews,
		totalLikes,
		totalComments,
		totalReviews,
		totalWordsWritten,
		averageRating: Math.round(averageRating * 10) / 10
	}

	return this.save()
}

userSchema.methods.addAchievement = function(title, description, icon = '🏆') {
	// Check if achievement already exists
	const exists = this.authorInfo.achievements.find(a => a.title === title)
	if (!exists) {
		this.authorInfo.achievements.push({
			title,
			description,
			icon,
			earnedAt: new Date()
		})
		return this.save()
	}
	return Promise.resolve(false)
}

userSchema.methods.updateWritingStreak = function() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const lastWriting = this.authorInfo.writingGoals.lastWritingDate
	if (!lastWriting) {
		// First time writing
		this.authorInfo.writingGoals.currentStreak = 1
		this.authorInfo.writingGoals.longestStreak = 1
		this.authorInfo.writingGoals.lastWritingDate = today
	} else {
		const lastWritingDate = new Date(lastWriting)
		lastWritingDate.setHours(0, 0, 0, 0)

		const diffTime = today - lastWritingDate
		const diffDays = diffTime / (1000 * 60 * 60 * 24)

		if (diffDays === 1) {
			// Consecutive day
			this.authorInfo.writingGoals.currentStreak += 1
			if (this.authorInfo.writingGoals.currentStreak > this.authorInfo.writingGoals.longestStreak) {
				this.authorInfo.writingGoals.longestStreak = this.authorInfo.writingGoals.currentStreak
			}
		} else if (diffDays === 0) {
			// Same day, no change
			return this.save()
		} else {
			// Streak broken
			this.authorInfo.writingGoals.currentStreak = 1
		}

		this.authorInfo.writingGoals.lastWritingDate = today
	}

	return this.save()
}

// Database indexes for performance and security
userSchema.index({ loginAttempts: 1, lockUntil: 1 })
userSchema.index({ passwordResetToken: 1 })

// Engagement indexes
userSchema.index({ followers: 1 })
userSchema.index({ following: 1 })
userSchema.index({ 'readingProgress.story': 1 })
userSchema.index({ 'readingProgress.lastRead': -1 })
userSchema.index({ 'readingLists.stories': 1 })
userSchema.index({ 'readingLists.isPublic': 1 })

// Author profile indexes
userSchema.index({ 'authorInfo.genres': 1 })
userSchema.index({ 'authorInfo.writingExperience': 1 })
userSchema.index({ 'stats.totalStoriesPublished': -1 })
userSchema.index({ 'stats.totalViews': -1 })
userSchema.index({ 'stats.averageRating': -1 })
userSchema.index({ 'stats.totalWordsWritten': -1 })
userSchema.index({ 'authorInfo.writingGoals.currentStreak': -1 })

export default mongoose.models.User || mongoose.model("User", userSchema);
