import connectDB from "./mongodb";
import Chapter from "@/models/Chapter";
import Story from "@/models/Story";
import User from "@/models/User";
// import { notifyAuthor, notifyFollowers } from './notifications'

export async function publishScheduledChapters() {
	try {
		await connectDB();

		const now = new Date();

		// Debug: Log current time for debugging
		console.log("🕐 Checking scheduled chapters at:", now.toISOString());

		// First, let's check ALL scheduled chapters to see what we have
		const allScheduledChapters = await Chapter.find({
			status: "scheduled",
		}).select("title scheduledPublishDate timezone");

		console.log(
			"📋 All scheduled chapters:",
			allScheduledChapters.map((ch) => ({
				title: ch.title,
				scheduledPublishDate: ch.scheduledPublishDate?.toISOString(),
				timezone: ch.timezone,
				shouldPublish: ch.scheduledPublishDate && ch.scheduledPublishDate <= now,
				timeDiff: ch.scheduledPublishDate ? `${Math.round((now - ch.scheduledPublishDate) / 1000 / 60)} minutes` : "no date",
			}))
		);

		// Try multiple query variations to catch edge cases
		const queries = [
			{ status: "scheduled", scheduledPublishDate: { $lte: now } },
			{ status: "scheduled", scheduledPublishDate: { $exists: true, $ne: null, $lte: now } },
			{ status: "scheduled", $and: [{ scheduledPublishDate: { $exists: true } }, { scheduledPublishDate: { $lte: now } }] },
		];

		let scheduledChapters = [];
		for (const [index, query] of queries.entries()) {
			const results = await Chapter.find(query).populate("story author");
			console.log(`📊 Query ${index + 1} found:`, results.length, "chapters");
			if (results.length > 0 && scheduledChapters.length === 0) {
				scheduledChapters = results;
				console.log(`✅ Using results from query ${index + 1}`);
			}
		}

		console.log(`🎯 Final result: ${scheduledChapters.length} chapters ready to publish`);
		if (scheduledChapters.length > 0) {
			console.log(
				"📚 Chapters to publish:",
				scheduledChapters.map((ch) => ({
					id: ch._id,
					title: ch.title,
					scheduledPublishDate: ch.scheduledPublishDate?.toISOString(),
					timezone: ch.timezone,
					story: ch.story?.title,
					author: ch.author?.name,
				}))
			);
		}

		for (const chapter of scheduledChapters) {
			try {
				if (process.env.NODE_ENV === "development") {
					console.log(`Publishing chapter: ${chapter.title}`);
				}

				// Update chapter status
				chapter.status = "published";
				chapter.scheduledPublishDate = null;
				chapter.timezone = null;
				await chapter.save();

				// Update story's last updated date
				await Story.findByIdAndUpdate(chapter.story._id, {
					updatedAt: new Date(),
				});

				// Update author stats
				await chapter.author.updateStats();

				if (process.env.NODE_ENV === "development") {
					console.log(`✅ Successfully published: ${chapter.title}`);
				}

				// Send notifications to the author
				try {
					// await notifyAuthor(chapter.author, chapter.story, chapter);
				} catch (notifyError) {
					console.error("Error sending author notification:", notifyError);
				}

				// Send notifications to followers
				try {
					// await notifyFollowers(chapter.author, chapter.story, chapter)
				} catch (notifyError) {
					console.error("Error sending follower notifications:", notifyError);
				}
			} catch (error) {
				console.error(`Error publishing chapter ${chapter._id}:`, error);
			}
		}

		return {
			success: true,
			published: scheduledChapters.length,
			message: `Successfully published ${scheduledChapters.length} scheduled chapters`,
		};
	} catch (error) {
		console.error("Error in publishScheduledChapters:", error);
		return {
			success: false,
			error: error.message,
		};
	}
}

// Function to check and publish scheduled chapters (can be called by cron job)
export async function checkScheduledPublishing() {
	const result = await publishScheduledChapters();

	if (result.success) {
	} else {
		console.error("Failed to publish scheduled chapters:", result.error);
	}

	return result;
}
