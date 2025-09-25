"use client";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List, Clock, Eye, Heart, MessageCircle, BookOpen } from "lucide-react";

export function ChapterNavigation({ story, currentChapter, previousChapter, nextChapter, className }) {
	return (
		<div className={cn("space-y-6", className)}>
			{/* Previous/Next Navigation */}
			<div className="flex justify-between items-center">
				<div className="flex-1">
					{previousChapter ? (
						<Button asChild variant="outline" className="h-auto p-4">
							<Link href={`/story/${story.slug}/chapter/${previousChapter.chapterNumber}`}>
								<div className="flex items-center gap-3">
									<ChevronLeft className="h-5 w-5" />
									<div className="text-left">
										<div className="text-xs text-muted-foreground">Previous</div>
										<div className="font-medium truncate max-w-[200px]">
											Chapter {previousChapter.chapterNumber}: {previousChapter.title}
										</div>
									</div>
								</div>
							</Link>
						</Button>
					) : (
						<div></div>
					)}
				</div>

				<div className="flex-1 flex justify-end">
					{nextChapter ? (
						<Button asChild variant="outline" className="h-auto p-4">
							<Link href={`/story/${story.slug}/chapter/${nextChapter.chapterNumber}`}>
								<div className="flex items-center gap-3">
									<div className="text-right">
										<div className="text-xs text-muted-foreground">Next</div>
										<div className="font-medium truncate max-w-[200px]">
											Chapter {nextChapter.chapterNumber}: {nextChapter.title}
										</div>
									</div>
									<ChevronRight className="h-5 w-5" />
								</div>
							</Link>
						</Button>
					) : (
						<div></div>
					)}
				</div>
			</div>

			{/* Chapter Info */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-start justify-between mb-4">
						<div className="flex-1">
							<h3 className="font-semibold text-lg mb-1">
								Chapter {currentChapter.chapterNumber}: {currentChapter.title}
							</h3>
							<p className="text-sm text-muted-foreground mb-2">
								From "{story.title}" by{" "}
								<Link href={`/profile/${story.author.username}`} className="hover:underline">
									{story.author.name}
								</Link>
							</p>
						</div>
						<Badge variant={currentChapter.status === "published" ? "default" : "secondary"}>{currentChapter.status}</Badge>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div className="flex items-center gap-2 text-muted-foreground">
							<BookOpen className="h-4 w-4" />
							<span>{currentChapter.wordCount || 0} words</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<Clock className="h-4 w-4" />
							<span>{currentChapter.readingTime || 0} min read</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<Eye className="h-4 w-4" />
							<span>{currentChapter.views || 0} views</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<Heart className="h-4 w-4" />
							<span>{currentChapter.likes?.length || 0} likes</span>
						</div>
					</div>

					{currentChapter.analytics && (
						<div className="mt-4 pt-4 border-t border-border">
							<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
								<div className="text-center">
									<div className="font-medium text-foreground">{Math.round(currentChapter.analytics.completionRate || 0)}%</div>
									<div className="text-xs text-muted-foreground">Completion Rate</div>
								</div>
								<div className="text-center">
									<div className="font-medium text-foreground">{Math.round((currentChapter.analytics.averageReadTime || 0) / 60)}m</div>
									<div className="text-xs text-muted-foreground">Avg. Read Time</div>
								</div>
								<div className="text-center">
									<div className="font-medium text-foreground">{currentChapter.analytics.uniqueReaders || 0}</div>
									<div className="text-xs text-muted-foreground">Unique Readers</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export function ChapterTableOfContents({ story, chapters, currentChapter, className }) {
	return (
		<Card className={cn("", className)}>
			<CardContent className="p-0">
				<div className="p-4 border-b border-border">
					<h3 className="font-semibold flex items-center gap-2">
						<List className="h-3 w-4" />
						Table of Contents
					</h3>
					<p className="text-sm text-muted-foreground mt-1">{chapters.length} chapters</p>
				</div>

				<div className="max-h-80 overflow-y-auto">
					{chapters.map((chapter) => (
						<Link key={chapter._id} href={`/story/${story.slug}/chapter/${chapter.chapterNumber}`} className={cn("block p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors", currentChapter._id === chapter._id && "bg-primary/10 border-l-4 border-l-primary")}>
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-sm font-medium text-muted-foreground">Chapter {chapter.chapterNumber}</span>
										<Badge variant={chapter.status === "published" ? "default" : "secondary"} className="text-xs">
											{chapter.status}
										</Badge>
									</div>
									<h4 className="font-medium truncate text-foreground">{chapter.title}</h4>
									<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
										<span className="flex items-center gap-1">
											<BookOpen className="h-3 w-3" />
											{chapter.wordCount || 0} words
										</span>
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{chapter.readingTime || 0} min
										</span>
										<span className="flex items-center gap-1">
											<Eye className="h-3 w-3" />
											{chapter.views || 0}
										</span>
									</div>
								</div>
								{currentChapter._id === chapter._id && (
									<div className="ml-2 text-primary">
										<Eye className="h-4 w-4" />
									</div>
								)}
							</div>
						</Link>
					))}
				</div>

				{chapters.length === 0 && (
					<div className="p-8 text-center text-muted-foreground">
						<BookOpen className="h-8 w-8 mx-auto mb-2" />
						<p>No chapters published yet.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
