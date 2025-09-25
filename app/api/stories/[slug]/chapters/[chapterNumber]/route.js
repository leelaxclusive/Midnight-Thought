import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Story from "@/models/Story";
import Chapter from "@/models/Chapter";
import User from "@/models/User";
import { sanitizeForStorage } from "@/lib/sanitize";

// GET /api/stories/[slug]/chapters/[chapterNumber] - Get a specific chapter
export async function GET(request, { params }) {
	try {
		await dbConnect();
		const { slug, chapterNumber } = await params;

		// Find the story
		const story = await Story.findOne({ slug }).populate("author");
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		// Find the chapter
		const chapter = await Chapter.findOne({
			story: story._id,
			chapterNumber: parseInt(chapterNumber),
		})
			.populate({
				path: "comments.user",
				select: "name username avatar",
			})
			.populate({
				path: "comments.replies.user",
				select: "name username avatar",
			})
			.lean();

		if (!chapter) {
			return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
		}

		const session = await getServerSession();
		console.log(session.user.email, story.author.email);
		// Check if user has access to this chapter
		if (chapter.status !== "published") {
			if (!session || session.user.email !== story.author.email) {
				return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
			}
		}

		// Increment views
		await Chapter.findByIdAndUpdate(chapter._id, { $inc: { views: 1 } });

		// Get all chapters for navigation
		const allChapters = await Chapter.find({
			story: story._id,
			status: "published",
		})
			.select("chapterNumber title status")
			.sort({ chapterNumber: 1 });

		const chapterWithStats = {
			...chapter,
			likes: chapter.likes?.length || 0,
			comments: chapter.comments?.length || 0,
			story: {
				_id: story._id,
				title: story.title,
				slug: story.slug,
				author: story.author,
				genre: story.genre,
				status: story.status,
			},
			navigation: {
				chapters: allChapters,
				current: parseInt(chapterNumber),
			},
		};

		return NextResponse.json({ chapter: chapterWithStats });
	} catch (error) {
		console.error("Get chapter error:", error);
		return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
	}
}

// PUT /api/stories/[slug]/chapters/[chapterNumber] - Update a chapter
export async function PUT(request, { params }) {
	try {
		const session = await getServerSession();

		if (!session) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		await dbConnect();
		const { slug, chapterNumber } = await params;

		const body = await request.json();
		const { title, content, status, notes, scheduledPublishDate } = body;

		// Find the story
		const story = await Story.findOne({ slug });
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		// Find the chapter
		const chapter = await Chapter.findOne({
			story: story._id,
			chapterNumber: parseInt(chapterNumber),
		});

		if (!chapter) {
			return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
		}

		// Find the user
		const user = await User.findOne({ email: session.user.email });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if user is the author
		if (story.author.toString() !== user._id.toString()) {
			return NextResponse.json({ error: "Not authorized to update this chapter" }, { status: 403 });
		}

		// Update fields with sanitization
		const updateData = {};
		if (title) updateData.title = title;
		if (content) updateData.content = sanitizeForStorage(content, "editor");
		if (status) updateData.status = status;
		if (notes !== undefined) updateData.notes = sanitizeForStorage(notes, "comments");
		if (scheduledPublishDate) updateData.scheduledPublishDate = new Date(scheduledPublishDate);

		const updatedChapter = await Chapter.findByIdAndUpdate(chapter._id, updateData, { new: true, runValidators: true });

		// Update story's last updated time
		await Story.findByIdAndUpdate(story._id, { lastUpdated: new Date() });

		// Update story's total word count if content changed
		if (content) {
			const allChapters = await Chapter.find({ story: story._id, status: "published" });
			const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
			await Story.findByIdAndUpdate(story._id, { totalWords });
		}

		return NextResponse.json({
			message: "Chapter updated successfully",
			chapter: {
				...updatedChapter.toObject(),
				likesCount: updatedChapter.likes?.length || 0,
				commentsCount: updatedChapter.comments?.length || 0,
			},
		});
	} catch (error) {
		console.error("Update chapter error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map((err) => err.message);
			return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
		}

		return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
	}
}

// DELETE /api/stories/[slug]/chapters/[chapterNumber] - Delete a chapter
export async function DELETE(request, { params }) {
	try {
		const session = await getServerSession();

		if (!session) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		await dbConnect();
		const { slug, chapterNumber } = await params;

		// Find the story
		const story = await Story.findOne({ slug });
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		// Find the chapter
		const chapter = await Chapter.findOne({
			story: story._id,
			chapterNumber: parseInt(chapterNumber),
		});

		if (!chapter) {
			return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
		}

		// Find the user
		const user = await User.findOne({ email: session.user.email });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if user is the author
		if (story.author.toString() !== user._id.toString()) {
			return NextResponse.json({ error: "Not authorized to delete this chapter" }, { status: 403 });
		}

		// Remove chapter from story's chapters array
		await Story.findByIdAndUpdate(story._id, {
			$pull: { chapters: chapter._id },
			$set: { lastUpdated: new Date() },
		});

		// Delete the chapter
		await Chapter.findByIdAndDelete(chapter._id);

		// Update story's total word count
		const remainingChapters = await Chapter.find({ story: story._id, status: "published" });
		const totalWords = remainingChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
		await Story.findByIdAndUpdate(story._id, { totalWords });

		return NextResponse.json({
			message: "Chapter deleted successfully",
		});
	} catch (error) {
		console.error("Delete chapter error:", error);
		return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
	}
}
