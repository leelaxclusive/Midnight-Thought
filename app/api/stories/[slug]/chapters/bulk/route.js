import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Story from "@/models/Story";
import Chapter from "@/models/Chapter";
import User from "@/models/User";
import { sanitizeForStorage } from "@/lib/sanitize";

// POST /api/stories/[slug]/chapters/bulk - Create multiple chapters at once
export async function POST(request, { params }) {
	try {
		const session = await getServerSession();

		if (!session) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		await dbConnect();
		const resolvedParams = await params;

		const body = await request.json();
		const { chapters } = body;

		// Validate that chapters array exists and is not empty
		if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
			return NextResponse.json({ error: "Chapters array is required and must not be empty" }, { status: 400 });
		}

		// Validate each chapter has required fields
		const invalidChapters = chapters.filter(chapter => !chapter.title || !chapter.content);
		if (invalidChapters.length > 0) {
			return NextResponse.json({
				error: `${invalidChapters.length} chapters are missing title or content`
			}, { status: 400 });
		}

		// Find the story
		const story = await Story.findOne({ slug: resolvedParams.slug });
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		// Find the user
		const user = await User.findOne({ email: session.user.email });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if user is the author
		if (story.author.toString() !== user._id.toString()) {
			return NextResponse.json({ error: "Not authorized to add chapters to this story" }, { status: 403 });
		}

		// Get the last chapter number for auto-incrementing
		const lastChapter = await Chapter.findOne({
			story: story._id,
		})
			.sort({ chapterNumber: -1 })
			.select("chapterNumber");

		let currentChapterNumber = (lastChapter?.chapterNumber || 0) + 1;

		// Create chapters in batch
		const createdChapters = [];
		const chapterIds = [];

		for (const chapterData of chapters) {
			// Sanitize content before storage
			const sanitizedContent = sanitizeForStorage(chapterData.content, "editor");
			const sanitizedNotes = chapterData.notes ? sanitizeForStorage(chapterData.notes, "comments") : "";

			// Create chapter
			const chapter = await Chapter.create({
				title: chapterData.title,
				content: sanitizedContent,
				story: story._id,
				author: user._id,
				chapterNumber: currentChapterNumber,
				status: chapterData.status || "draft",
				notes: sanitizedNotes,
				scheduledPublishDate: chapterData.scheduledPublishDate ? new Date(chapterData.scheduledPublishDate) : null,
				timezone: chapterData.timezone || null,
			});

			createdChapters.push({
				...chapter.toObject(),
				likes: 0,
				comments: 0,
			});
			chapterIds.push(chapter._id);
			currentChapterNumber++;
		}

		// Add all chapters to story's chapters array
		await Story.findByIdAndUpdate(story._id, {
			$push: { chapters: { $each: chapterIds } },
			$set: { lastUpdated: new Date() },
		});

		// Update story's total word count
		const allChapters = await Chapter.find({ story: story._id, status: "published" });
		const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
		await Story.findByIdAndUpdate(story._id, { totalWords });

		return NextResponse.json(
			{
				message: `Successfully created ${createdChapters.length} chapters`,
				chapters: createdChapters,
				summary: {
					total: createdChapters.length,
					drafts: createdChapters.filter(c => c.status === 'draft').length,
					published: createdChapters.filter(c => c.status === 'published').length,
					scheduled: createdChapters.filter(c => c.status === 'scheduled').length,
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Bulk create chapters error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map((err) => err.message);
			return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
		}

		return NextResponse.json({ error: "Failed to create chapters" }, { status: 500 });
	}
}