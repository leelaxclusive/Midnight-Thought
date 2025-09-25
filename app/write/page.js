"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navigation/Navbar";
import { BookOpen, Save, Eye, Plus, X, AlertCircle } from "lucide-react";

export default function Write() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();

	const editingStory = searchParams.get("story"); // Story slug to edit

	const [storyForm, setStoryForm] = useState({
		title: "",
		description: "",
		genre: "",
		tags: [],
		language: "English",
		status: "draft",
		visibility: "public",
	});
	const [tagInput, setTagInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [editStory, setEditStory] = useState(null);

	const genres = ["Romance", "Fantasy", "Science Fiction", "Mystery", "Thriller", "Horror", "Adventure", "Young Adult", "Drama", "Comedy", "Historical Fiction", "Contemporary", "Paranormal", "Other"];

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/auth/signin");
		}
	}, [status, router]);

	useEffect(() => {
		if (editingStory && session) {
			loadStoryForEditing(editingStory);
		}
	}, [editingStory, session]);

	const loadStoryForEditing = async (storySlug) => {
		try {
			setLoading(true);
			const response = await fetch(`/api/stories/${storySlug}`);
			if (response.ok) {
				const data = await response.json();
				const story = data.story;

				// Populate the form with story data
				setStoryForm({
					title: story.title,
					description: story.description,
					genre: story.genre,
					tags: story.tags || [],
					language: story.language,
					status: story.status,
					visibility: story.visibility,
				});

				setEditStory(story);
			} else {
				setError("Failed to load story for editing");
			}
		} catch (error) {
			console.error("Failed to load story:", error);
			setError("Failed to load story for editing");
		} finally {
			setLoading(false);
		}
	};

	if (status === "loading") {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="animate-pulse">
						<div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
						<div className="h-64 bg-muted rounded"></div>
					</div>
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	const handleStorySubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const isEditing = editStory !== null;
			const url = isEditing ? `/api/stories/${editStory.slug}` : "/api/stories";
			const method = isEditing ? "PUT" : "POST";

			const response = await fetch(url, {
				method: method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: storyForm.title,
					description: storyForm.description,
					genre: storyForm.genre,
					tags: storyForm.tags,
					language: storyForm.language,
					status: storyForm.status,
					visibility: storyForm.visibility,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(isEditing ? "Story updated successfully!" : "Story created successfully!");

				if (!isEditing) {
					// Reset form only for new stories
					setStoryForm({
						title: "",
						description: "",
						genre: "",
						tags: [],
						language: "English",
						status: "draft",
						visibility: "public",
					});
				} else {
					// Update the edit story data for editing
					setEditStory(data.story);
				}

				// Redirect to story details after a short delay
				setTimeout(() => {
					router.push(`/story/${data.story.slug}`);
				}, 2000);
			} else {
				setError(data.error || (isEditing ? "Failed to update story" : "Failed to create story"));
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const addTag = () => {
		if (tagInput.trim() && !storyForm.tags.includes(tagInput.trim())) {
			setStoryForm((prev) => ({
				...prev,
				tags: [...prev.tags, tagInput.trim()],
			}));
			setTagInput("");
		}
	};

	const removeTag = (tagToRemove) => {
		setStoryForm((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addTag();
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">{editStory ? `Edit Story: ${editStory.title}` : "Create New Story"}</h1>
					<p className="text-muted-foreground">{editStory ? "Update your story details, status, and settings." : "Start your literary journey by creating a new story. You can add chapters later from your dashboard."}</p>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
						<AlertCircle className="h-5 w-5 text-red-600 mr-3" />
						<span className="text-red-700">{error}</span>
					</div>
				)}

				{success && (
					<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
						<svg className="h-5 w-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
						</svg>
						<span className="text-green-700">{success}</span>
					</div>
				)}

				<Card>
					<CardHeader>
						<CardTitle>{editStory ? "Story Settings" : "Create New Story"}</CardTitle>
						<CardDescription>{editStory ? "Update your story information and settings" : "Create a new story and set its basic information"}</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleStorySubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="story-title">Title *</Label>
									<Input id="story-title" value={storyForm.title} onChange={(e) => setStoryForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Enter your story title" required maxLength={100} />
								</div>

								<div className="space-y-2">
									<Label htmlFor="genre">Genre *</Label>
									<Select value={storyForm.genre} onValueChange={(value) => setStoryForm((prev) => ({ ...prev, genre: value }))}>
										<SelectTrigger>
											<SelectValue placeholder="Select a genre" />
										</SelectTrigger>
										<SelectContent>
											{genres.map((genre) => (
												<SelectItem key={genre} value={genre}>
													{genre}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description *</Label>
								<Textarea id="description" value={storyForm.description} onChange={(e) => setStoryForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe your story... What's it about? What can readers expect?" required maxLength={1000} className="min-h-[120px]" />
								<p className="text-xs text-muted-foreground">{storyForm.description.length}/1000 characters</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="tags">Tags</Label>
								<div className="flex space-x-2">
									<Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Add tags (press Enter to add)" maxLength={100} />
									<Button type="button" onClick={addTag} size="sm">
										<Plus className="h-4 w-4" />
									</Button>
								</div>
								{storyForm.tags.length > 0 && (
									<div className="flex flex-wrap gap-2 mt-2">
										{storyForm.tags.map((tag) => (
											<Badge key={tag} variant="secondary" className="flex items-center gap-1">
												{tag}
												<button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:bg-secondary-foreground/20 rounded-full">
													<X className="h-3 w-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
								<p className="text-xs text-muted-foreground">{storyForm.tags.length} Tags</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="status">Status</Label>
									<Select value={storyForm.status} onValueChange={(value) => setStoryForm((prev) => ({ ...prev, status: value }))}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="ongoing">Ongoing</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
											<SelectItem value="hiatus">Hiatus</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										{storyForm.status === "draft" && "Story is not visible to public"}
										{storyForm.status === "ongoing" && "Story is actively being updated"}
										{storyForm.status === "completed" && "Story is finished"}
										{storyForm.status === "hiatus" && "Story is temporarily on hold"}
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="visibility">Visibility</Label>
									<Select value={storyForm.visibility} onValueChange={(value) => setStoryForm((prev) => ({ ...prev, visibility: value }))}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="public">Public</SelectItem>
											<SelectItem value="unlisted">Unlisted</SelectItem>
											<SelectItem value="private">Private</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="language">Language</Label>
									<Select value={storyForm.language} onValueChange={(value) => setStoryForm((prev) => ({ ...prev, language: value }))}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="English">English</SelectItem>
											<SelectItem value="Spanish">Spanish</SelectItem>
											<SelectItem value="French">French</SelectItem>
											<SelectItem value="German">German</SelectItem>
											<SelectItem value="Other">Other</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex justify-between">
								<div>
									{editStory && (
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setEditStory(null);
												setStoryForm({
													title: "",
													description: "",
													genre: "",
													tags: [],
													language: "English",
													status: "draft",
													visibility: "public",
												});
												router.push("/write");
											}}
										>
											<X className="h-4 w-4 mr-2" />
											Cancel Edit
										</Button>
									)}
								</div>
								<div className="space-x-4">
									<Button type="button" variant="outline">
										<Eye className="h-4 w-4 mr-2" />
										Preview
									</Button>
									<Button type="submit" disabled={loading}>
										<Save className="h-4 w-4 mr-2" />
										{loading ? (editStory ? "Updating..." : "Creating...") : editStory ? "Update Story" : "Create Story"}
									</Button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
