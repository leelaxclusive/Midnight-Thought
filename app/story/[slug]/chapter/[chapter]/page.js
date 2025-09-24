"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createSanitizedHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ChapterNavigation, ChapterTableOfContents } from "@/components/ui/chapter-navigation";
import Navbar from "@/components/navigation/Navbar";
import Link from "next/link";
import { BookOpen, Heart, BookmarkIcon, Share2, MessageCircle, ThumbsUp, ChevronLeft, ChevronRight, Eye, Clock, ArrowUp, Settings, Type, Palette, Monitor } from "lucide-react";

export default function ChapterDetails({ params }) {
	const { data: session } = useSession();
	const router = useRouter();
	const contentRef = useRef(null);

	const [slug, setSlug] = useState(null);
	const [chapterNumber, setChapterNumber] = useState(null);

	const [story, setStory] = useState(null);
	const [chapter, setChapter] = useState(null);
	const [chapters, setChapters] = useState([]);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [isLiked, setIsLiked] = useState(false);
	const [readingProgress, setReadingProgress] = useState(0);
	const [showBackToTop, setShowBackToTop] = useState(false);
	const [readerSettings, setReaderSettings] = useState({
		fontSize: 16,
		fontFamily: "serif",
		theme: "light",
		lineHeight: 1.6,
		maxWidth: 700,
	});

	// Analytics tracking
	const [readingSession, setReadingSession] = useState(null);
	const [readingStartTime, setReadingStartTime] = useState(null);
	const [lastScrollTime, setLastScrollTime] = useState(null);
	const [totalReadingTime, setTotalReadingTime] = useState(0);

	useEffect(() => {
		const getParams = async () => {
			const resolvedParams = await params;
			setSlug(resolvedParams.slug);
			setChapterNumber(resolvedParams.chapter);
		};
		getParams();
	}, [params]);

	const loadChapterData = useCallback(async (storySlug, chapterNumber) => {
		try {
			const response = await fetch(`/api/stories/${storySlug}/chapters/${chapterNumber}`);

			if (!response.ok) {
				setStory(null);
				setChapter(null);
				setLoading(false);
				return;
			}

			const data = await response.json();
			setStory(data.chapter.story);
			setChapter(data.chapter);
			setChapters(data.chapter.navigation.chapters);

			// Load actual comments from API
			try {
				const commentsResponse = await fetch(`/api/stories/${storySlug}/chapters/${chapterNumber}/comments`);
				if (commentsResponse.ok) {
					const commentsData = await commentsResponse.json();
					setComments(commentsData.comments || []);
				} else {
					setComments([]);
				}
			} catch (error) {
				console.error("Error loading comments:", error);
				setComments([]);
			}
			setLoading(false);
		} catch (error) {
			console.error("Error loading chapter:", error);
			setLoading(false);
		}
	}, []);

	const loadUserInteractionStatus = useCallback(async () => {
		try {
			// Load like status for this chapter
			const likeResponse = await fetch(`/api/stories/${slug}/chapters/${chapterNumber}/like`);
			if (likeResponse.ok) {
				const likeData = await likeResponse.json();
				setIsLiked(likeData.liked);
			}
		} catch (error) {
			console.error("Error loading user interaction status:", error);
		}
	}, [slug, chapterNumber]);

	const startReadingSession = useCallback(async () => {
		if (!session || !chapter) return;

		try {
			const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// Start analytics session
			const response = await fetch(`/api/stories/${slug}/chapters/${chapterNumber}/analytics`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "start",
					sessionId,
				}),
			});

			// Add to currently reading
			await fetch('/api/user/currently-reading', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storySlug: slug,
					chapterNumber: parseInt(chapterNumber),
					scrollPosition: 0,
					timeSpent: 0
				})
			});

			if (response.ok) {
				setReadingSession(sessionId);
				setReadingStartTime(Date.now());
			}
		} catch (error) {
			console.error("Error starting reading session:", error);
		}
	}, [session, chapter, slug, chapterNumber]);

	const updateReadingSession = useCallback(async (timeSpent, scrollProgress, completed = false) => {
		if (!readingSession || !session) return;

		try {
			// Update analytics
			await fetch(`/api/stories/${slug}/chapters/${chapterNumber}/analytics`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update",
					sessionId: readingSession,
					timeSpent,
					scrollProgress: Math.round(scrollProgress),
					completed,
				}),
			});

			// Update reading progress
			await fetch('/api/user/currently-reading', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storySlug: slug,
					chapterNumber: parseInt(chapterNumber),
					scrollPosition: Math.round(scrollProgress),
					timeSpent
				})
			});
		} catch (error) {
			console.error("Error updating reading session:", error);
		}
	}, [readingSession, session, slug, chapterNumber]);

	useEffect(() => {
		if (slug && chapterNumber) {
			loadChapterData(slug, chapterNumber);
		}
	}, [slug, chapterNumber, loadChapterData]);

	// Load user interaction status when session becomes available
	useEffect(() => {
		if (slug && chapterNumber && session) {
			loadUserInteractionStatus();
		}
	}, [slug, chapterNumber, session, loadUserInteractionStatus]);

	// Start analytics tracking when chapter loads
	useEffect(() => {
		if (chapter && session) {
			startReadingSession();
		}
	}, [chapter, session, startReadingSession]);

	// Track reading time and send updates
	useEffect(() => {
		if (!readingSession || !readingStartTime) return;

		const interval = setInterval(() => {
			const now = Date.now();
			const timeSpent = Math.floor((now - readingStartTime) / 1000);
			setTotalReadingTime(timeSpent);

			// Send analytics update every 30 seconds
			if (timeSpent > 0 && timeSpent % 30 === 0) {
				updateReadingSession(timeSpent, readingProgress);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [readingSession, readingStartTime, readingProgress, updateReadingSession]);

	// Send final analytics when user leaves
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (readingSession && totalReadingTime > 0) {
				const completed = readingProgress >= 90; // Consider 90% as completed
				updateReadingSession(totalReadingTime, readingProgress, completed);
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [readingSession, totalReadingTime, readingProgress, updateReadingSession]);

	useEffect(() => {
		const handleScroll = () => {
			if (contentRef.current) {
				const element = contentRef.current;
				const scrolled = window.scrollY;
				const rate = scrolled / (element.scrollHeight - window.innerHeight);
				const progress = Math.min(Math.max(rate, 0), 1) * 100;
				setReadingProgress(progress);
				setShowBackToTop(scrolled > 500);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);


	const handleLike = async () => {
		try {
			const response = await fetch(`/api/stories/${slug}/chapters/${chapterNumber}/like`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				const data = await response.json();
				setIsLiked(data.liked);
			}
		} catch (error) {
			console.error("Error liking chapter:", error);
		}
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: `${chapter.title} - ${story.title}`,
				text: `Check out this chapter from ${story.title}`,
				url: window.location.href,
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
		}
	};

	const submitComment = async () => {
		if (!newComment.trim()) return;

		try {
			const response = await fetch(`/api/stories/${slug}/chapters/${chapterNumber}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: newComment }),
			});

			if (response.ok) {
				const data = await response.json();
				setComments((prev) => [...prev, data.comment]);
				setNewComment("");
			}
		} catch (error) {
			console.error("Error posting comment:", error);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const getTimeAgo = (date) => {
		if (!date) return "Unknown";
		const now = new Date();
		const targetDate = new Date(date);
		if (isNaN(targetDate.getTime())) return "Unknown";

		const diff = now - targetDate;
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (hours < 1) return "Just now";
		if (hours === 1) return "1 hour ago";
		if (hours < 24) return `${hours} hours ago`;
		if (days === 1) return "1 day ago";
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
		return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
	};

	const currentChapterIndex = chapters.findIndex((ch) => ch.chapterNumber === parseInt(chapterNumber));
	const previousChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
	const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

	if (loading) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="animate-pulse">
						<div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
						<div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
						<div className="space-y-4">
							{[...Array(8)].map((_, i) => (
								<div key={i} className="h-4 bg-muted rounded w-full"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!story || !chapter) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="text-center py-12">
						<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h1 className="text-2xl font-bold mb-2">Chapter Not Found</h1>
						<p className="text-muted-foreground mb-4">The chapter you&apos;re looking for doesn&apos;t exist or has been removed.</p>
						<Button asChild>
							<Link href="/explore">Discover Other Stories</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Reading Progress Bar */}
			<div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
				<div className="h-full bg-primary transition-all duration-150" style={{ width: `${readingProgress}%` }} />
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid lg:grid-cols-4 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-3">
						{/* Chapter Header */}
						<div className="mb-8">
							{/* Breadcrumb */}
							<div className="flex items-center text-sm text-muted-foreground mb-4">
								<Link href="/explore" className="hover:text-foreground">
									Stories
								</Link>
								<ChevronRight className="h-4 w-4 mx-2" />
								<Link href={`/story/${story.slug}`} className="hover:text-foreground">
									{story.title}
								</Link>
								<ChevronRight className="h-4 w-4 mx-2" />
								<span>Chapter {chapter.chapterNumber}</span>
							</div>

							<div className="flex items-center justify-between mb-4">
								<div>
									<h1 className="text-3xl font-bold text-foreground mb-2">{chapter.title}</h1>
									<div className="flex items-center space-x-4 text-sm text-muted-foreground">
										<Link href={`/profile/${story.author.username}`} className="flex items-center space-x-2 hover:text-foreground">
											<Avatar className="h-6 w-6">
												<AvatarImage src={story.author.avatar} alt={story.author.name} />
												<AvatarFallback>{story.author.name.charAt(0)}</AvatarFallback>
											</Avatar>
											<span>{story.author.name}</span>
										</Link>
										<span>•</span>
										<div className="flex items-center">
											<Clock className="h-3 w-3 mr-1" />
											{chapter.readingTime} min read
										</div>
										<span>•</span>
										<span>{getTimeAgo(chapter.publishedAt)}</span>
									</div>
								</div>

								{/* Reader Settings */}
								<div className="flex items-center space-x-2">
									<Button variant="outline" size="sm">
										<Settings className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{session && (
								<div className="flex space-x-2 mb-6">
									<Button variant={isLiked ? "default" : "outline"} onClick={handleLike} size="sm">
										<Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
										{isLiked ? "Liked" : "Like"} ({chapter.likesCount || 0})
									</Button>
									<Button variant="outline" onClick={handleShare} size="sm">
										<Share2 className="h-4 w-4 mr-2" />
										Share
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={async () => {
											try {
												await fetch(`/api/stories/${slug}/chapters/${chapterNumber}/save`, {
													method: "POST",
													headers: { "Content-Type": "application/json" },
												});
											} catch (error) {
												console.error("Error saving progress:", error);
											}
										}}
									>
										<BookmarkIcon className="h-4 w-4 mr-2" />
										Save Progress
									</Button>
								</div>
							)}
						</div>
						{/* Chapter Content */}
						<Card className="mb-8">
							<CardContent className="p-8">
								<div
									ref={contentRef}
									className="prose prose-lg max-w-none chapter-content"
									style={{
										fontSize: `${readerSettings.fontSize}px`,
										fontFamily: readerSettings.fontFamily === "serif" ? "Georgia, serif" : readerSettings.fontFamily === "sans" ? "Arial, sans-serif" : "monospace",
										lineHeight: readerSettings.lineHeight,
										maxWidth: `${readerSettings.maxWidth}px`,
										margin: "0 auto",
									}}
									dangerouslySetInnerHTML={createSanitizedHtml(chapter.content, "display")}
								/>
							</CardContent>
						</Card>

						{/* Author's Notes */}
						{chapter.notes && (
							<Card className="mb-8">
								<CardHeader>
									<CardTitle className="text-lg">Author&apos;s Notes</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground leading-relaxed">{chapter.notes}</p>
								</CardContent>
							</Card>
						)}

						{/* Chapter Navigation */}
						<div className="mb-8">
							<ChapterNavigation story={story} currentChapter={chapter} previousChapter={previousChapter} nextChapter={nextChapter} />
						</div>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						<div className="sticky top-24 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
							{/* Reading Progress */}
							<Card>
								<CardContent className="p-4">
									<div className="space-y-3">
										<div className="flex items-center justify-between text-sm">
											<span>Reading Progress</span>
											<span>{Math.round(readingProgress)}%</span>
										</div>
										<div className="w-full bg-muted rounded-full h-2">
											<div className="bg-primary h-2 rounded-full transition-all duration-150" style={{ width: `${readingProgress}%` }} />
										</div>
										<div className="text-xs text-muted-foreground">
											Reading time: {Math.floor(totalReadingTime / 60)}:{String(totalReadingTime % 60).padStart(2, "0")}
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Story Info */}
							<Card>
								<CardContent className="p-4">
									<div className="space-y-3">
										<h3 className="font-medium">{story.title}</h3>
										<p className="text-sm text-muted-foreground">by {story.author.name}</p>
										<div className="flex flex-wrap gap-1">
											{story.genre && (
												<Badge variant="secondary" className="text-xs">
													{story.genre}
												</Badge>
											)}
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Table of Contents */}
							<ChapterTableOfContents story={story} chapters={chapters} currentChapter={chapter} />
						</div>
					</div>
				</div>

				{/* Comments Section */}
				<div className="mt-8">
					<Card>
						<CardHeader>
							<CardTitle>Comments ({comments.length})</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{session && (
								<div className="space-y-4">
									<Textarea placeholder="Share your thoughts on this chapter..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[100px]" />
									<div className="flex justify-end">
										<Button onClick={submitComment} disabled={!newComment.trim()}>
											Post Comment
										</Button>
									</div>
								</div>
							)}

							{comments.map((comment) => (
								<div key={comment.id} className="space-y-4">
									<div className="flex space-x-3">
										<Avatar className="h-8 w-8 flex-shrink-0">
											<AvatarImage src={comment.user.avatar} alt={comment.user.name} />
											<AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
										</Avatar>
										<div className="flex-1 space-y-2">
											<div className="flex items-center space-x-2">
												<Link href={`/profile/${comment.user.username}`} className="font-medium hover:underline">
													{comment.user.name}
												</Link>
												<span className="text-sm text-muted-foreground">{getTimeAgo(comment.createdAt)}</span>
												{comment.paragraph && (
													<Badge variant="outline" className="text-xs">
														Paragraph {comment.paragraph}
													</Badge>
												)}
											</div>
											<p className="text-foreground leading-relaxed">{comment.content}</p>
											<div className="flex items-center space-x-4 text-sm">
												<button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
													<ThumbsUp className="h-3 w-3" />
													<span>{comment.likes}</span>
												</button>
												<button className="text-muted-foreground hover:text-foreground">Reply</button>
											</div>
										</div>
									</div>

									{/* Replies */}
									{comment.replies.map((reply) => (
										<div key={reply.id} className="ml-11 flex space-x-3">
											<Avatar className="h-6 w-6 flex-shrink-0">
												<AvatarImage src={reply.user.avatar} alt={reply.user.name} />
												<AvatarFallback className="text-xs">{reply.user.name.charAt(0)}</AvatarFallback>
											</Avatar>
											<div className="flex-1 space-y-2">
												<div className="flex items-center space-x-2">
													<Link href={`/profile/${reply.user.username}`} className="font-medium hover:underline text-sm">
														{reply.user.name}
													</Link>
													<span className="text-xs text-muted-foreground">{getTimeAgo(reply.createdAt)}</span>
												</div>
												<p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
												<div className="flex items-center space-x-4 text-xs">
													<button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
														<ThumbsUp className="h-3 w-3" />
														<span>{reply.likes}</span>
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							))}

							{comments.length === 0 && (
								<div className="text-center py-8">
									<MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground mb-4">No comments yet.</p>
									{session && <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Back to Top Button */}
			{showBackToTop && (
				<Button onClick={scrollToTop} className="fixed bottom-8 right-8 rounded-full w-12 h-12 p-0" size="lg">
					<ArrowUp className="h-5 w-5" />
				</Button>
			)}
		</div>
	);
}
