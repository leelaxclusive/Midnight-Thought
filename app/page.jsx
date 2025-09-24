"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import Link from "next/link";
import { BookOpen, Heart, Star, Clock, Eye, MessageSquare, TrendingUp, Zap, Calendar, User, Loader2 } from "lucide-react";
import { LoadingStoryCard, LoadingSpinner, LoadingSkeleton } from "@/components/ui/loading";

export default function Home() {
	const [stats, setStats] = useState(null);
	const [trendingStories, setTrendingStories] = useState([]);
	const [recentUpdates, setRecentUpdates] = useState([]);
	const [completedStories, setCompletedStories] = useState([]);
	const [genres, setGenres] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadHomeData();
	}, []);

	// Fetch with retry logic
	const fetchWithRetry = async (url, retries = 2, delay = 1000) => {
		for (let i = 0; i <= retries; i++) {
			try {
				const response = await fetch(url);
				if (response.ok) {
					return response;
				}
				if (i === retries) {
					throw new Error(`API failed after ${retries + 1} attempts: ${response.status}`);
				}
			} catch (error) {
				if (i === retries) {
					throw error;
				}
				if (process.env.NODE_ENV === 'development') {
					console.warn(`Attempt ${i + 1} failed for ${url}, retrying in ${delay}ms...`);
				}
				await new Promise(resolve => setTimeout(resolve, delay));
				delay *= 2; // Exponential backoff
			}
		}
	};

	// Parse JSON with better error handling
	const parseJsonSafely = async (response, name) => {
		try {
			const text = await response.text();
			if (!text.trim()) {
				return { stories: [], error: 'empty_response' };
			}
			const data = JSON.parse(text);
			return data;
		} catch (parseError) {
			console.error(`Error parsing ${name} JSON:`, parseError);
			return { stories: [], error: 'parse_error' };
		}
	};

	// Fetch individual API with fallback
	const fetchApiSafely = async (url, name) => {
		try {
			const response = await fetchWithRetry(url);
			return await parseJsonSafely(response, name);
		} catch (error) {
			console.error(`${name} API completely failed:`, error);
			return { stories: [], error: error.message };
		}
	};

	const loadHomeData = async () => {
		try {
			setLoading(true);
			setError(null);

			// Load all data with individual error handling
			const [statsData, trendingData, recentData, completedData] = await Promise.all([
				fetchApiSafely("/api/home/stats", "Stats"),
				fetchApiSafely("/api/home/trending?limit=3", "Trending"),
				fetchApiSafely("/api/home/recent?limit=4", "Recent"),
				fetchApiSafely("/api/home/completed?limit=3", "Completed")
			]);

			// Set data with fallbacks
			setStats(statsData.error ? {} : statsData);
			setTrendingStories(trendingData.stories || []);
			setRecentUpdates(recentData.stories || []);
			setCompletedStories(completedData.stories || []);

			// Check if any critical APIs failed
			const failures = [
				statsData.error && 'Stats',
				trendingData.error && 'Trending',
				recentData.error && 'Recent',
				completedData.error && 'Completed'
			].filter(Boolean);

			if (failures.length > 0) {
				// Don't set error state for partial failures - just log them
				// The UI will gracefully handle empty arrays
			}

			// Format genres for display
			const formattedGenres =
				statsData.genres?.slice(0, 6).map((genre) => ({
					name: genre.name,
					count: genre.count,
					color: getGenreColor(genre.name),
				})) || [];
			setGenres(formattedGenres);
		} catch (err) {
			console.error("Error loading home data:", err);
			setError(`Failed to load content: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const getGenreColor = (genreName) => {
		const colorMap = {
			Fantasy: "bg-purple-100 text-purple-800",
			Romance: "bg-rose-100 text-rose-800",
			Mystery: "bg-indigo-100 text-indigo-800",
			"Sci-Fi": "bg-blue-100 text-blue-800",
			"Science Fiction": "bg-blue-100 text-blue-800",
			Thriller: "bg-gray-100 text-gray-800",
			Adventure: "bg-green-100 text-green-800",
			Horror: "bg-red-100 text-red-800",
			Comedy: "bg-yellow-100 text-yellow-800",
			Drama: "bg-orange-100 text-orange-800",
		};
		return colorMap[genreName] || "bg-slate-100 text-slate-800";
	};

	const formatNumber = (num) => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + "M";
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + "K";
		}
		return num?.toString() || "0";
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="flex items-center justify-center min-h-[50vh]">
					<div className="text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
						<p className="text-muted-foreground">Loading amazing stories...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="flex items-center justify-center min-h-[50vh]">
					<div className="text-center">
						<p className="text-destructive mb-4">{error}</p>
						<Button onClick={loadHomeData}>Try Again</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Hero Section - Story Focused */}
			<section className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
							Discover Amazing <span className="text-primary">Stories</span>
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">Dive into captivating tales from talented writers around the world. New chapters published daily.</p>
					</div>

					{/* Quick Stats */}
					{stats && (
						<div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-8">
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{formatNumber(stats.stories.published)}+</div>
								<div className="text-sm text-muted-foreground">Active Stories</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{formatNumber(stats.chapters.total)}+</div>
								<div className="text-sm text-muted-foreground">Chapters</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{formatNumber(stats.users.total)}+</div>
								<div className="text-sm text-muted-foreground">Users</div>
							</div>
						</div>
					)}

					<div className="flex justify-center">
						<Button size="lg" asChild>
							<Link href="/explore">Start Reading</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Trending Stories */}
			<section className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2 mb-8">
						<TrendingUp className="h-6 w-6 text-primary" />
						<h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-6">
						{loading ? (
							Array.from({ length: 3 }).map((_, index) => (
								<LoadingStoryCard key={index} />
							))
						) : trendingStories.length > 0 ? (
							trendingStories.map((story, index) => (
								<Card key={story.id} className="hover:shadow-lg">
									<CardHeader>
										<div className="flex justify-between items-start mb-2">
											<div className="flex items-center gap-2">
												<Badge variant="secondary">{story.genre}</Badge>
												{story.isHot && <Badge className="bg-yellow-100 text-yellow-800">🔥 Hot</Badge>}
											</div>
											<div className="flex items-center gap-1 text-sm text-muted-foreground">
												<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
												{story.rating.toFixed(1)}
											</div>
										</div>
										<CardTitle className="line-clamp-2">
											<Link href={`/story/${story.slug}`} className="hover:text-primary">
												{story.title}
											</Link>
										</CardTitle>
										<CardDescription>
											by{" "}
											<Link href={`/profile/${story.author.username}`} className="hover:text-primary">
												{story.author.name}
											</Link>
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground mb-4 line-clamp-3">{story.description}</p>
										{story.tags.length > 0 && (
											<div className="flex gap-1 mb-3">
												{story.tags.slice(0, 2).map((tag) => (
													<Badge key={tag} variant="outline" className="text-xs">
														{tag}
													</Badge>
												))}
											</div>
										)}
										<div className="flex justify-between text-xs text-muted-foreground">
											<div className="flex items-center gap-2">
												<div className="flex items-center">
													<Eye className="h-3 w-3 mr-1" />
													{formatNumber(story.views)}
												</div>
												<div className="flex items-center">
													<Heart className="h-3 w-3 mr-1" />
													{story.likes}
												</div>
											</div>
											<div className="flex items-center">
												<BookOpen className="h-3 w-3 mr-1" />
												{story.chapters} chapters
											</div>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="col-span-3 text-center py-12">
								<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">No trending stories yet. Be the first to publish!</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Browse by Genre */}
			<section className="py-16 bg-muted/30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl font-bold text-foreground mb-8">Browse by Genre</h2>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{loading ? (
							Array.from({ length: 6 }).map((_, index) => (
								<Card key={index} className="animate-pulse">
									<CardContent className="p-4 text-center">
										<LoadingSkeleton className="h-6 w-16 mx-auto mb-2" />
										<LoadingSkeleton className="h-3 w-12 mx-auto" />
									</CardContent>
								</Card>
							))
						) : genres.length > 0 ? (
							genres.map((genre) => (
								<Link key={genre.name} href={`/explore?genre=${genre.name.toLowerCase()}`}>
									<Card className="hover:shadow-md cursor-pointer">
										<CardContent className="p-4 text-center">
											<div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${genre.color}`}>{genre.name}</div>
											<div className="text-xs text-muted-foreground">{genre.count} stories</div>
										</CardContent>
									</Card>
								</Link>
							))
						) : (
							<div className="col-span-6 text-center py-8">
								<p className="text-muted-foreground">Loading genres...</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Recent Updates */}
			<section className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center mb-8">
						<div className="flex items-center gap-2">
							<Zap className="h-6 w-6 text-primary" />
							<h2 className="text-3xl font-bold text-foreground">Latest Updates</h2>
						</div>
						<Button variant="outline" asChild>
							<Link href="/explore?sort=recent">View All</Link>
						</Button>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{loading ? (
							Array.from({ length: 4 }).map((_, index) => (
								<LoadingStoryCard key={index} />
							))
						) : recentUpdates.length > 0 ? (
							recentUpdates.map((story) => (
								<Card key={story.id} className="hover:shadow-lg">
									<CardHeader className="pb-3">
										<div className="flex justify-between items-start mb-2">
											<Badge variant="secondary" className="text-xs">
												{story.genre}
											</Badge>
											{story.isCompleted && <Badge className="bg-green-100 text-green-800 text-xs">Complete</Badge>}
										</div>
										<CardTitle className="line-clamp-2 text-lg">
											<Link href={`/story/${story.slug}`} className="hover:text-primary">
												{story.title}
											</Link>
										</CardTitle>
										<CardDescription className="text-sm">
											by{" "}
											<Link href={`/profile/${story.author.username}`} className="hover:text-primary">
												{story.author.name}
											</Link>
										</CardDescription>
									</CardHeader>
									<CardContent className="pt-0">
										<p className="text-sm text-muted-foreground mb-3 line-clamp-2">{story.description}</p>
										<div className="flex justify-between items-center text-xs text-muted-foreground">
											<div className="flex items-center">
												<Calendar className="h-3 w-3 mr-1" />
												{story.lastUpdated}
											</div>
											<div className="flex items-center gap-2">
												<div className="flex items-center">
													<MessageSquare className="h-3 w-3 mr-1" />
													{story.comments}
												</div>
												<div className="flex items-center">
													<BookOpen className="h-3 w-3 mr-1" />
													{story.chapters}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="col-span-4 text-center py-12">
								<Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">No recent updates available.</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Completed Stories */}
			{completedStories.length > 0 && (
				<section className="py-16 bg-muted/30">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center mb-8">
							<h2 className="text-3xl font-bold text-foreground">Complete Stories</h2>
							<Button variant="outline" asChild>
								<Link href="/explore?status=completed">View All Complete</Link>
							</Button>
						</div>

						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
							{completedStories.length > 0 ? (
								completedStories.map((story) => (
									<Card key={story.id} className="hover:shadow-lg">
										<CardHeader>
											<div className="flex justify-between items-start mb-2">
												<Badge variant="secondary">{story.genre}</Badge>
												<Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
											</div>
											<CardTitle className="line-clamp-2">
												<Link href={`/story/${story.slug}`} className="hover:text-primary">
													{story.title}
												</Link>
											</CardTitle>
											<CardDescription>
												by{" "}
												<Link href={`/profile/${story.author.username}`} className="hover:text-primary">
													{story.author.name}
												</Link>
											</CardDescription>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground mb-4 line-clamp-3">{story.description}</p>
											<div className="flex justify-between items-center text-xs text-muted-foreground">
												<div className="flex items-center gap-2">
													<div className="flex items-center">
														<Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
														{story.rating.toFixed(1)}
													</div>
													<div className="flex items-center">
														<Heart className="h-3 w-3 mr-1" />
														{story.likes}
													</div>
												</div>
												<div className="flex items-center">
													<BookOpen className="h-3 w-3 mr-1" />
													{story.chapters} chapters
												</div>
											</div>
										</CardContent>
									</Card>
								))
							) : (
								<div className="col-span-3 text-center py-12">
									<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">No completed stories yet.</p>
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{/* Writers CTA - Moved to bottom and less prominent */}
			<section className="py-16 border-t">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-2xl font-bold text-foreground mb-4">Have a Story to Tell?</h2>
					<p className="text-muted-foreground mb-6">Join our community of writers and share your creativity with readers who love great stories.</p>
					<Button variant="outline" asChild>
						<Link href="/auth/signup">Start Writing</Link>
					</Button>
				</div>
			</section>

			<Footer />
		</div>
	);
}
