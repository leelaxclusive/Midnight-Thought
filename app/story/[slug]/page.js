"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navigation/Navbar";
import Link from "next/link";
import { BookOpen, Heart, BookmarkIcon, Share2, Eye, Clock, Users, MessageCircle, ThumbsUp, ChevronRight } from "lucide-react";

export default function StoryDetails({ params }) {
	const { data: session } = useSession();
	const [story, setStory] = useState(null);
	const [chapters, setChapters] = useState([]);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [isLiked, setIsLiked] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isFollowing, setIsFollowing] = useState(false);
	const [slug, setSlug] = useState(null);

	useEffect(() => {
		const getParams = async () => {
			const resolvedParams = await params;
			setSlug(resolvedParams.slug);
		};
		getParams();
	}, [params]);

	const loadStoryData = useCallback(async (slug) => {
		try {
			const response = await fetch(`/api/stories/${slug}`);

			if (!response.ok) {
				setStory(null);
				setLoading(false);
				return;
			}

			const data = await response.json();
			setStory(data.story);

			// Load chapters
			const chaptersResponse = await fetch(`/api/stories/${slug}/chapters`);
			if (chaptersResponse.ok) {
				const chaptersData = await chaptersResponse.json();
				setChapters(chaptersData.chapters);
			}

			// Load actual comments from API
			try {
				const commentsResponse = await fetch(`/api/stories/${slug}/comments`)
				if (commentsResponse.ok) {
					const commentsData = await commentsResponse.json()
					setComments(commentsData.comments || [])
				} else {
					setComments([])
				}
			} catch (error) {
				console.error('Error loading comments:', error)
				setComments([])
			}
			setLoading(false);
		} catch (error) {
			console.error("Error loading story:", error);
			setStory(null);
			setLoading(false);
		}
	}, []);

	const loadUserInteractionStatus = useCallback(async () => {
		try {
			// Load like status
			const likeResponse = await fetch(`/api/stories/${slug}/like`)
			if (likeResponse.ok) {
				const likeData = await likeResponse.json()
				setIsLiked(likeData.liked)
			}

			// Load save status
			const saveResponse = await fetch(`/api/stories/${slug}/save`)
			if (saveResponse.ok) {
				const saveData = await saveResponse.json()
				setIsSaved(saveData.saved)
			}

			// TODO: Load follow status when follow functionality is implemented
			// For now, keep it as false
			setIsFollowing(false)

		} catch (error) {
			console.error('Error loading user interaction status:', error)
		}
	}, [slug]);

	useEffect(() => {
		if (slug) {
			loadStoryData(slug);
		}
	}, [slug, loadStoryData]);

	// Load user interaction status when session becomes available
	useEffect(() => {
		if (slug && session) {
			loadUserInteractionStatus();
		}
	}, [slug, session, loadUserInteractionStatus]);

	const handleLike = async () => {
		try {
			const response = await fetch(`/api/stories/${slug}/like`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				const data = await response.json();
				setIsLiked(data.liked);
			}
		} catch (error) {
			console.error("Error liking story:", error);
		}
	};

	const handleSave = async () => {
		try {
			const response = await fetch(`/api/stories/${slug}/save`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				const data = await response.json();
				setIsSaved(data.saved);
			}
		} catch (error) {
			console.error("Error saving story:", error);
		}
	};

	const handleFollow = () => {
		setIsFollowing(!isFollowing);
		// API call would go here
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: story.title,
				text: story.description,
				url: window.location.href,
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
		}
	};

	const submitComment = async () => {
		if (!newComment.trim()) return;

		try {
			const response = await fetch(`/api/stories/${slug}/comments`, {
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

	if (loading) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 py-8">
					<div className="animate-pulse">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
							<div className="lg:col-span-2 space-y-6">
								<div className="h-64 bg-muted rounded-lg"></div>
								<div className="h-48 bg-muted rounded-lg"></div>
							</div>
							<div className="space-y-6">
								<div className="h-32 bg-muted rounded-lg"></div>
								<div className="h-48 bg-muted rounded-lg"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!story) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 py-8">
					<div className="text-center py-12">
						<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h1 className="text-2xl font-bold mb-2">Story Not Found</h1>
						<p className="text-muted-foreground mb-4">The story you&apos;re looking for doesn&apos;t exist or has been removed.</p>
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

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-8">
						{/* Story Header */}
						<Card>
							<CardHeader>
								<div className="flex flex-wrap gap-2 mb-4">
									<Badge variant="secondary">{story.genre}</Badge>
									<Badge variant={story.status === "completed" ? "default" : "outline"}>{story.status}</Badge>
									{story.featured && <Badge variant="default">Featured</Badge>}
								</div>

								<CardTitle className="text-3xl mb-2">{story.title}</CardTitle>

								<div className="flex items-center space-x-4 mb-4">
									<Link href={`/profile/${story.author.username}`} className="flex items-center space-x-2 hover:opacity-80">
										<Avatar className="h-8 w-8">
											<AvatarImage src={story.author.avatar} alt={story.author.name} />
											<AvatarFallback>{story.author.name.charAt(0)}</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">{story.author.name}</p>
											<p className="text-sm text-muted-foreground">@{story.author.username}</p>
										</div>
									</Link>

									{session && story.author.username !== session.user?.username && (
										<Button variant={isFollowing ? "secondary" : "default"} size="sm" onClick={handleFollow}>
											<Users className="h-4 w-4 mr-1" />
											{isFollowing ? "Following" : "Follow"}
										</Button>
									)}
								</div>

								<div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
									<div className="flex items-center">
										<Eye className="h-4 w-4 mr-1" />
										{story.views.toLocaleString()} views
									</div>
									<div className="flex items-center">
										<Heart className="h-4 w-4 mr-1" />
										{story.likes} likes
									</div>
									<div className="flex items-center">
										<BookmarkIcon className="h-4 w-4 mr-1" />
										{story.saves} saves
									</div>
								</div>

								<div className="flex flex-wrap gap-1 mb-4">
									{story.tags.map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">
											#{tag}
										</Badge>
									))}
								</div>

								{session && (
									<div className="flex space-x-2">
										<Button variant={isLiked ? "default" : "outline"} onClick={handleLike} className="flex-1">
											<Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
											{isLiked ? "Liked" : "Like"}
										</Button>
										<Button variant={isSaved ? "default" : "outline"} onClick={handleSave} className="flex-1">
											<BookmarkIcon className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
											{isSaved ? "Saved" : "Save"}
										</Button>
										<Button variant="outline" onClick={handleShare}>
											<Share2 className="h-4 w-4 mr-2" />
											Share
										</Button>
									</div>
								)}
							</CardHeader>
						</Card>

						{/* Story Description */}
						<Card>
							<CardHeader>
								<CardTitle>About This Story</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="whitespace-pre-line text-foreground leading-relaxed">{story.description}</div>
								<div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
									<div>
										<span className="font-medium">Language:</span> {story.language}
									</div>
									<div>
										<span className="font-medium">Total Words:</span> {story.totalWords.toLocaleString()}
									</div>
									<div>
										<span className="font-medium">Started:</span> {new Date(story.createdAt).toLocaleDateString()}
									</div>
									<div>
										<span className="font-medium">Last Updated:</span> {getTimeAgo(new Date(story.updatedAt))}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Table of Contents */}
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<BookOpen className="h-5 w-5" />
										Table of Contents
									</CardTitle>
									<Badge variant="secondary" className="text-xs">
										{chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
									</Badge>
								</div>
								<CardDescription>
									Navigate through the story chapters
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2">
								{chapters.map((chapter, index) => (
									<Link key={chapter._id || chapter.id} href={`/story/${story.slug}/chapter/${chapter.chapterNumber}`}>
										<div className="group flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 cursor-pointer">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 mb-2">
													<div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
														{chapter.chapterNumber}
													</div>
													<h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
														{chapter.title}
													</h3>
												</div>
												<div className="flex items-center gap-4 text-xs text-muted-foreground ml-11">
													<div className="flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{chapter.readingTime} min
													</div>
													<div className="flex items-center gap-1">
														<BookOpen className="h-3 w-3" />
														{chapter.wordCount} words
													</div>
													<div className="flex items-center gap-1">
														<Heart className="h-3 w-3" />
														{chapter.likes}
													</div>
													<div className="flex items-center gap-1">
														<MessageCircle className="h-3 w-3" />
														{chapter.comments}
													</div>
													{chapter.publishedAt && (
														<div className="hidden sm:block">
															{getTimeAgo(new Date(chapter.publishedAt))}
														</div>
													)}
												</div>
											</div>
											<div className="flex-shrink-0 ml-2">
												<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
											</div>
										</div>
									</Link>
								))}

								{chapters.length === 0 && (
									<div className="text-center py-12">
										<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
											<BookOpen className="h-8 w-8 text-muted-foreground" />
										</div>
										<h3 className="font-medium text-foreground mb-2">No chapters yet</h3>
										<p className="text-sm text-muted-foreground mb-4">This story hasn&apos;t been published yet.</p>
										{session && story.author.username === session.user?.username && (
											<Button asChild size="sm">
												<Link href={`/write?story=${story.slug}`}>
													Add First Chapter
												</Link>
											</Button>
										)}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Comments */}
						<Card>
							<CardHeader>
								<CardTitle>Comments ({comments.length})</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{session && (
									<div className="space-y-4">
										<Textarea placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[100px]" />
										<div className="flex justify-end">
											<Button onClick={submitComment} disabled={!newComment.trim()}>
												Post Comment
											</Button>
										</div>
									</div>
								)}

								{comments.map((comment) => (
									<div key={comment._id || comment.id} className="space-y-4">
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
											<div key={reply._id || reply.id} className="ml-11 flex space-x-3">
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

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Author Info */}
						<Card>
							<CardHeader>
								<CardTitle>About the Author</CardTitle>
							</CardHeader>
							<CardContent>
								<Link href={`/profile/${story.author.username}`} className="block">
									<div className="flex items-center space-x-3 mb-4">
										<Avatar className="h-12 w-12">
											<AvatarImage src={story.author.avatar} alt={story.author.name} />
											<AvatarFallback>{story.author.name.charAt(0)}</AvatarFallback>
										</Avatar>
										<div>
											<h3 className="font-medium">{story.author.name}</h3>
											<p className="text-sm text-muted-foreground">@{story.author.username}</p>
											<p className="text-sm text-muted-foreground">{story.author.followers} followers</p>
										</div>
									</div>
								</Link>
								<p className="text-sm text-muted-foreground leading-relaxed">{story.author.bio}</p>
							</CardContent>
						</Card>

						{/* Story Stats */}
						<Card>
							<CardHeader>
								<CardTitle>Story Statistics</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Total Views</span>
									<span className="font-medium">{story.views.toLocaleString()}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Likes</span>
									<span className="font-medium">{story.likes}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Saves</span>
									<span className="font-medium">{story.saves}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Chapters</span>
									<span className="font-medium">{chapters.length}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Word Count</span>
									<span className="font-medium">{story.totalWords.toLocaleString()}</span>
								</div>
							</CardContent>
						</Card>

						{chapters.length > 0 && (
							<Button asChild className="w-full" size="lg">
								<Link href={`/story/${story.slug}/chapter/1`}>
									<BookOpen className="h-4 w-4 mr-2" />
									Start Reading
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
