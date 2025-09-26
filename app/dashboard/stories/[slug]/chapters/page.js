"use client";
import { useState, useEffect, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MarkdownEditor, markdownToHtml, getWordCount, markdownToPlainText } from "@/components/ui/markdown-editor";
import { BulkChapterUpload } from "@/components/ui/bulk-chapter-upload";
import Navbar from "@/components/navigation/Navbar";
import Link from "next/link";
import { BookOpen, Edit3, Eye, Trash2, Plus, ArrowLeft, Calendar, Clock, FileText, Settings, Save, Upload } from "lucide-react";

export default function ChapterManagement({ params }) {
	const resolvedParams = use(params);
	const { data: session, status } = useSession();
	const router = useRouter();

	const [story, setStory] = useState(null);
	const [chapters, setChapters] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedChapter, setSelectedChapter] = useState(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [chapterToDelete, setChapterToDelete] = useState(null);

	const [chapterForm, setChapterForm] = useState({
		title: "",
		content: "",
		status: "scheduled",
		notes: "",
		scheduledPublishDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
	});

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/auth/signin");
		}
	}, [status, router]);

	const loadStoryAndChapters = useCallback(async () => {
		try {
			setLoading(true);

			// Load story details
			const storyResponse = await fetch(`/api/stories/${resolvedParams.slug}`);
			if (storyResponse.ok) {
				const storyData = await storyResponse.json();
				setStory(storyData.story);
			}

			// Load chapters
			const chaptersResponse = await fetch(`/api/stories/${resolvedParams.slug}/chapters`);
			if (chaptersResponse.ok) {
				const chaptersData = await chaptersResponse.json();
				setChapters(chaptersData.chapters || []);
			}
		} catch (error) {
			console.error("Error loading story and chapters:", error);
		} finally {
			setLoading(false);
		}
	}, [resolvedParams.slug]);

	useEffect(() => {
		if (session && resolvedParams.slug) {
			loadStoryAndChapters();
		}
	}, [session, resolvedParams.slug, loadStoryAndChapters]);

	const openCreateDialog = () => {
		setChapterForm({
			title: "",
			content: "",
			status: "scheduled",
			notes: "",
			scheduledPublishDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
		});
		setSelectedChapter(null);
		setIsCreateDialogOpen(true);
	};

	const openEditDialog = async (chapter) => {
		try {
			// Get full chapter details
			const response = await fetch(`/api/stories/${resolvedParams.slug}/chapters/${chapter.chapterNumber}`);
			if (response.ok) {
				const data = await response.json();
				const fullChapter = data.chapter;

				setSelectedChapter(fullChapter);
				console.log(fullChapter.scheduledPublishDate);

				setChapterForm({
					title: fullChapter.title,
					content: fullChapter.content,
					status: fullChapter.status,
					notes: fullChapter.notes || "",
					scheduledPublishDate: fullChapter.scheduledPublishDate ? new Date(new Date(fullChapter.scheduledPublishDate).getTime() - new Date(fullChapter.scheduledPublishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
				});
				setIsEditDialogOpen(true);
			}
		} catch (error) {
			console.error("Error loading chapter details:", error);
		}
	};

	const handleCreateChapter = async (e) => {
		e.preventDefault();

		try {
			const response = await fetch(`/api/stories/${resolvedParams.slug}/chapters`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...chapterForm,
					content: chapterForm.content, // Keep HTML formatting for rich text display
					scheduledPublishDate: chapterForm.scheduledPublishDate ? new Date(chapterForm.scheduledPublishDate) : null,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setChapters([...chapters, data.chapter]);
				setIsCreateDialogOpen(false);
				resetForm();
			} else {
				const error = await response.json();
				alert(error.error || "Failed to create chapter");
			}
		} catch (error) {
			console.error("Error creating chapter:", error);
			alert("Failed to create chapter");
		}
	};

	const handleUpdateChapter = async (e) => {
		e.preventDefault();
		if (!selectedChapter) return;

		try {
			const response = await fetch(`/api/stories/${resolvedParams.slug}/chapters/${selectedChapter.chapterNumber}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...chapterForm,
					content: chapterForm.content, // Keep HTML formatting for rich text display
					scheduledPublishDate: chapterForm.scheduledPublishDate ? new Date(chapterForm.scheduledPublishDate) : null,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setChapters(chapters.map((c) => (c._id === selectedChapter._id ? data.chapter : c)));
				setIsEditDialogOpen(false);
				setSelectedChapter(null);
				resetForm();
			} else {
				const error = await response.json();
				alert(error.error || "Failed to update chapter");
			}
		} catch (error) {
			console.error("Error updating chapter:", error);
			alert("Failed to update chapter");
		}
	};

	const handleDeleteChapter = async (chapter) => {
		try {
			const response = await fetch(`/api/stories/${resolvedParams.slug}/chapters/${chapter.chapterNumber}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setChapters(chapters.filter((c) => c._id !== chapter._id));
				setIsDeleteDialogOpen(false);
				setChapterToDelete(null);
			} else {
				const error = await response.json();
				alert(error.error || "Failed to delete chapter");
			}
		} catch (error) {
			console.error("Error deleting chapter:", error);
			alert("Failed to delete chapter");
		}
	};

	const resetForm = () => {
		setChapterForm({
			title: "",
			content: "",
			status: "scheduled",
			notes: "",
			scheduledPublishDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
		});
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "published":
				return "bg-green-100 text-green-800 border-green-200";
			case "draft":
				return "bg-gray-100 text-gray-800 border-gray-200";
			case "scheduled":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "private":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getTimeAgo = (date) => {
		const now = new Date();
		const diff = now - new Date(date);
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return "Today";
		if (days === 1) return "1 day ago";
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
		return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
	};

	if (status === "loading" || loading) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 py-8">
					<div className="animate-pulse">
						<div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="h-24 bg-muted rounded-lg"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	if (!story) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 py-8">
					<div className="text-center py-12">
						<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h1 className="text-2xl font-bold mb-2">Story Not Found</h1>
						<p className="text-muted-foreground mb-4">The story you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
						<Button asChild>
							<Link href="/dashboard/stories">Back to Stories</Link>
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
				{/* Header */}
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
					<div>
						<div className="flex items-center space-x-2 mb-2">
							<Button asChild variant="ghost" size="sm">
								<Link href="/dashboard/stories">
									<ArrowLeft className="h-4 w-4 mr-1" />
									Back to Stories
								</Link>
							</Button>
						</div>
						<h1 className="text-3xl font-bold text-foreground mb-2">Chapters: {story.title}</h1>
						<div className="flex items-center space-x-2">
							<Badge className={getStatusColor(story.status)}>{story.status}</Badge>
							<Badge variant="outline">{story.visibility}</Badge>
							<Badge variant="secondary">{story.genre}</Badge>
						</div>
					</div>
					<div className="flex space-x-2">
						<Button asChild variant="outline">
							<Link href={`/story/${story.slug}`}>
								<Eye className="h-4 w-4 mr-2" />
								View Story
							</Link>
						</Button>
						<Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(true)}>
							<Upload className="h-4 w-4 mr-2" />
							Bulk Upload
						</Button>
						<Button onClick={openCreateDialog}>
							<Plus className="h-4 w-4 mr-2" />
							New Chapter
						</Button>
					</div>
				</div>

				{/* Story Stats */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Story Overview</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{chapters.length}</div>
								<div className="text-muted-foreground">Total Chapters</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{chapters.filter((c) => c.status === "published").length}</div>
								<div className="text-muted-foreground">Published</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{chapters.filter((c) => c.status === "draft").length}</div>
								<div className="text-muted-foreground">Drafts</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{story.totalWords?.toLocaleString() || 0}</div>
								<div className="text-muted-foreground">Total Words</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Chapters List */}
				<Card>
					<CardHeader>
						<CardTitle>Chapters ({chapters.length})</CardTitle>
						<CardDescription>Manage all chapters for your story. Click on a chapter to edit it.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{chapters
								.sort((a, b) => a.chapterNumber - b.chapterNumber)
								.map((chapter) => (
									<div key={chapter._id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-2">
												<h3 className="font-medium">
													Chapter {chapter.chapterNumber}: {chapter.title}
												</h3>
											</div>

											<div className="flex items-center gap-2 mb-2">
												<Badge className={getStatusColor(chapter.status)}>{chapter.status}</Badge>
												{chapter.scheduledPublishDate && chapter.status === "scheduled" && (
													<Badge variant="outline">
														<Calendar className="h-3 w-3 mr-1" />
														{new Date(chapter.scheduledPublishDate).toLocaleDateString()} - {new Date(chapter.scheduledPublishDate).toLocaleTimeString()}
													</Badge>
												)}

												{chapter.createdAt && chapter.status === "published" && (
													<Badge variant="outline">
														<Calendar className="h-3 w-3 mr-1" />
														{new Date(chapter.createdAt).toLocaleDateString()} - {new Date(chapter.createdAt).toLocaleTimeString()}
													</Badge>
												)}
											</div>

											<div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
												<div className="flex items-center">
													<FileText className="h-4 w-4 mr-1" />
													{chapter.wordCount || 0} words
												</div>
												<div className="flex items-center">
													<Clock className="h-4 w-4 mr-1" />
													{chapter.readingTime || 0} min read
												</div>
												<div className="flex items-center">
													<Eye className="h-4 w-4 mr-1" />
													{chapter.views || 0} views
												</div>
												<div className="flex items-center">💝 {chapter.likesCount || 0} likes</div>
											</div>

											{chapter.notes && (
												<div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
													<strong>Notes:</strong> {chapter.notes}
												</div>
											)}
										</div>

										<div className="flex items-center space-x-2 ml-4">
											{chapter.status === "published" && (
												<Button asChild variant="ghost" size="sm">
													<Link href={`/story/${story.slug}/chapter/${chapter.chapterNumber}`}>
														<Eye className="h-4 w-4" />
													</Link>
												</Button>
											)}
											<Button variant="ghost" size="sm" onClick={() => openEditDialog(chapter)}>
												<Edit3 className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													setChapterToDelete(chapter);
													setIsDeleteDialogOpen(true);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}

							{chapters.length === 0 && (
								<div className="text-center py-12">
									<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-medium mb-2">No chapters yet</h3>
									<p className="text-muted-foreground mb-4">Start writing your story by creating the first chapter.</p>
									<Button onClick={openCreateDialog}>
										<Plus className="h-4 w-4 mr-2" />
										Create First Chapter
									</Button>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Create/Edit Chapter Dialog */}
				<Dialog
					open={isCreateDialogOpen || isEditDialogOpen}
					onOpenChange={(open) => {
						if (!open) {
							setIsCreateDialogOpen(false);
							setIsEditDialogOpen(false);
							resetForm();
						}
					}}
				>
					<DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>{selectedChapter ? "Edit Chapter" : "Create New Chapter"}</DialogTitle>
							<DialogDescription>{selectedChapter ? "Update your chapter content and settings" : "Write and configure your new chapter"}</DialogDescription>
						</DialogHeader>

						<form onSubmit={selectedChapter ? handleUpdateChapter : handleCreateChapter} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="chapter-title">Chapter Title</Label>
								<Input id="chapter-title" value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} placeholder="Enter chapter title..." required />
							</div>
							{/* Chapter number is now auto-generated */}

							<div className="space-y-2">
								<Label htmlFor="chapter-content">Chapter Content</Label>
								<MarkdownEditor value={chapterForm.content} onChange={(content) => setChapterForm({ ...chapterForm, content })} placeholder="Write your chapter content in markdown..." minHeight="400px" className="w-full" />
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="chapter-status">Status</Label>
									<Select value={chapterForm.status} onValueChange={(value) => setChapterForm({ ...chapterForm, status: value })}>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="published">Published</SelectItem>
											<SelectItem value="scheduled">Scheduled</SelectItem>
											<SelectItem value="private">Private</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{chapterForm.status === "scheduled" && (
									<div className="space-y-2">
										<Label htmlFor="scheduled-date">Scheduled Date</Label>
										<Input id="scheduled-date" type="datetime-local" value={chapterForm.scheduledPublishDate} onChange={(e) => setChapterForm({ ...chapterForm, scheduledPublishDate: e.target.value })} />
									</div>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="chapter-notes">Author Notes (optional)</Label>
								<Textarea id="chapter-notes" value={chapterForm.notes} onChange={(e) => setChapterForm({ ...chapterForm, notes: e.target.value })} rows={3} placeholder="Add any notes about this chapter..." />
							</div>

							<div className="flex justify-end space-x-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsCreateDialogOpen(false);
										setIsEditDialogOpen(false);
										resetForm();
									}}
								>
									Cancel
								</Button>
								<Button type="submit">
									<Save className="h-4 w-4 mr-2" />
									{selectedChapter ? "Update Chapter" : "Create Chapter"}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>

				{/* Delete Confirmation Dialog */}
				<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Chapter</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete &quot;Chapter {chapterToDelete?.chapterNumber}: {chapterToDelete?.title}&quot;? This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={() => chapterToDelete && handleDeleteChapter(chapterToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
								Delete Chapter
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Bulk Chapter Upload Dialog */}
				<BulkChapterUpload
					isOpen={isBulkUploadDialogOpen}
					onClose={() => setIsBulkUploadDialogOpen(false)}
					onSuccess={loadStoryAndChapters}
					storySlug={resolvedParams.slug}
				/>
			</div>
		</div>
	);
}
