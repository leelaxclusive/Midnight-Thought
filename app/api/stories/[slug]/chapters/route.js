import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Story from "@/models/Story";
import Chapter from "@/models/Chapter";
import User from "@/models/User";
import { sanitizeForStorage } from "@/lib/sanitize";

// GET /api/stories/[slug]/chapters - Get all chapters for a story
export async function GET(request, { params }) {
	try {
		await dbConnect();
		const resolvedParams = await params;

		// Find the story
		const story = await Story.findOne({ slug: resolvedParams.slug }).populate("author");
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		const session = await getServerSession();
		let query = { story: story._id };

		// If not the author, show published chapters and scheduled chapters that should be published
		if (!session || session.user.email !== story.author.email) {
			const now = new Date();
			query.$or = [
				{ status: "published" },
				{
					status: "scheduled",
					scheduledPublishDate: { $lte: now },
				},
			];
		}

		const chapters = await Chapter.find(query).select("title chapterNumber status scheduledPublishDate createdAt updatedAt wordCount readingTime likes comments notes").sort({ chapterNumber: 1 }).lean();

		const chaptersWithStats = chapters.map((chapter) => ({
			...chapter,
			likes: chapter.likes?.length || 0,
			comments: chapter.comments?.length || 0,
		}));

		return NextResponse.json({ chapters: chaptersWithStats });
	} catch (error) {
		console.error("Get chapters error:", error);
		return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
	}
}

// POST /api/stories/[slug]/chapters - Create a new chapter
export async function POST(request, { params }) {
	try {
		const session = await getServerSession();

		if (!session) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		await dbConnect();
		const resolvedParams = await params;

		const body = await request.json();
		const { title, content, status, notes, scheduledDate } = body;

		// Validate required fields (removed chapterNumber)
		if (!title || !content) {
			return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
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

		// Auto-generate chapter number based on existing chapters
		const lastChapter = await Chapter.findOne({
			story: story._id,
		})
			.sort({ chapterNumber: -1 })
			.select("chapterNumber");

		const chapterNumber = (lastChapter?.chapterNumber || 0) + 1;

		// Sanitize content before storage
		const sanitizedContent = sanitizeForStorage(content, "editor");
		const sanitizedNotes = notes ? sanitizeForStorage(notes, "comments") : "";

		// Create chapter
		const chapter = await Chapter.create({
			title,
			content: sanitizedContent,
			story: story._id,
			author: user._id,
			chapterNumber,
			status: status || "draft",
			notes: sanitizedNotes,
			scheduledPublishDate: scheduledDate ? new Date(scheduledDate) : null,
		});

		// Add chapter to story's chapters array
		await Story.findByIdAndUpdate(story._id, {
			$push: { chapters: chapter._id },
			$set: { lastUpdated: new Date() },
		});

		// Update story's total word count
		const allChapters = await Chapter.find({ story: story._id, status: "published" });
		const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
		await Story.findByIdAndUpdate(story._id, { totalWords });

		return NextResponse.json(
			{
				message: "Chapter created successfully",
				chapter: {
					...chapter.toObject(),
					likes: 0,
					comments: 0,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create chapter error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map((err) => err.message);
			return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
		}

		return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
	}
}
