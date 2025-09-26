"use client";
import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { MarkdownEditor } from "./markdown-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Upload, FileText, Plus, Trash2, Download, AlertTriangle, CheckCircle } from "lucide-react";

export function BulkChapterUpload({ isOpen, onClose, onSuccess, storySlug }) {
	const [activeTab, setActiveTab] = useState("json");
	const [chapters, setChapters] = useState([
		{
			title: "",
			content: "",
			status: "draft",
			notes: "",
			scheduledPublishDate: "",
		},
	]);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadResult, setUploadResult] = useState(null);
	const [errors, setErrors] = useState([]);

	const addChapter = () => {
		setChapters([
			...chapters,
			{
				title: "",
				content: "",
				status: "draft",
				notes: "",
				scheduledPublishDate: "",
			},
		]);
	};

	const removeChapter = (index) => {
		if (chapters.length > 1) {
			setChapters(chapters.filter((_, i) => i !== index));
		}
	};

	const updateChapter = (index, field, value) => {
		const updated = chapters.map((chapter, i) => (i === index ? { ...chapter, [field]: value } : chapter));
		setChapters(updated);
	};

	const validateChapters = () => {
		const newErrors = [];
		chapters.forEach((chapter, index) => {
			if (!chapter.title.trim()) {
				newErrors.push(`Chapter ${index + 1}: Title is required`);
			}
			if (!chapter.content.trim()) {
				newErrors.push(`Chapter ${index + 1}: Content is required`);
			}
			if (chapter.status === "scheduled" && !chapter.scheduledPublishDate) {
				newErrors.push(`Chapter ${index + 1}: Scheduled date is required for scheduled chapters`);
			}
		});
		setErrors(newErrors);
		return newErrors.length === 0;
	};

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const text = e.target.result;

				if (file.name.endsWith(".json")) {
					const data = JSON.parse(text);
					if (Array.isArray(data) && data.length > 0) {
						setChapters(
							data.map((chapter) => ({
								title: chapter.title || "",
								content: chapter.content || "",
								status: chapter.status || "draft",
								notes: chapter.notes || "",
								scheduledPublishDate: chapter.scheduledPublishDate || "",
							}))
						);
					}
				} else if (file.name.endsWith(".csv")) {
					const lines = text.split("\n");
					const headers = lines[0].split(",").map((h) => h.trim());
					const data = [];

					for (let i = 1; i < lines.length; i++) {
						if (lines[i].trim()) {
							const values = lines[i].split(",");
							const chapter = {};
							headers.forEach((header, index) => {
								chapter[header] = values[index]?.trim() || "";
							});
							data.push(chapter);
						}
					}

					if (data.length > 0) {
						setChapters(
							data.map((chapter) => ({
								title: chapter.title || "",
								content: chapter.content || "",
								status: chapter.status || "draft",
								notes: chapter.notes || "",
								scheduledPublishDate: chapter.scheduledPublishDate || "",
							}))
						);
					}
				}
			} catch (error) {
				console.error("Error parsing file:", error);
				setErrors(["Error parsing file. Please check the format."]);
			}
		};
		reader.readAsText(file);
	};

	const downloadTemplate = () => {
		const template = [
			{
				title: "Chapter 1: The Beginning",
				content: "# Chapter 1: The Beginning\n\nIt was a **dark and stormy night** when our story begins...\n\n## The Awakening\n\nThe protagonist *slowly* opened their eyes to find:\n\n- A mysterious letter\n- An ancient key\n- A sense of destiny\n\n> \"Sometimes the greatest adventures begin with the smallest steps.\"",
				status: "draft",
				notes: "Optional notes about this chapter",
				scheduledPublishDate: "2024-12-25T10:00",
			},
			{
				title: "Chapter 2: The Journey",
				content: "# Chapter 2: The Journey\n\nThe next morning brought new challenges...\n\n## Preparation\n\nOur hero needed to gather:\n\n1. Supplies for the journey\n2. Information about the destination\n3. Courage to face the unknown\n\n```\n// A mysterious code was found\nlet secret = \"The answer lies within\";\n```\n\n![A map](https://example.com/map.jpg)\n\nWith everything ready, the journey could finally begin.",
				status: "scheduled",
				notes: "",
				scheduledPublishDate: "2024-12-26T10:00",
			},
		];

		if (activeTab === "json") {
			const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "chapters-template.json";
			a.click();
			URL.revokeObjectURL(url);
		} else if (activeTab === "csv") {
			const csvContent = ["title,content,status,notes,scheduledPublishDate", '"Chapter 1: The Beginning","# Chapter 1\n\nIt was a **dark and stormy night**...","draft","Optional notes","2024-12-25T10:00"', '"Chapter 2: The Journey","# Chapter 2\n\nThe next morning brought *new challenges*...","scheduled","","2024-12-26T10:00"'].join("\n");

			const blob = new Blob([csvContent], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "chapters-template.csv";
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	const handleUpload = async () => {
		if (!validateChapters()) return;

		setIsUploading(true);
		setUploadProgress(0);
		setUploadResult(null);

		try {
			const response = await fetch(`/api/stories/${storySlug}/chapters/bulk`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ chapters }),
			});

			const data = await response.json();

			if (response.ok) {
				setUploadResult({
					success: true,
					message: data.message,
					summary: data.summary,
				});
				setUploadProgress(100);
				setTimeout(() => {
					onSuccess();
					onClose();
					resetForm();
				}, 2000);
			} else {
				setUploadResult({
					success: false,
					message: data.error,
				});
			}
		} catch (error) {
			console.error("Upload error:", error);
			setUploadResult({
				success: false,
				message: "Failed to upload chapters. Please try again.",
			});
		} finally {
			setIsUploading(false);
		}
	};

	const resetForm = () => {
		setChapters([
			{
				title: "",
				content: "",
				status: "draft",
				notes: "",
				scheduledPublishDate: "",
			},
		]);
		setErrors([]);
		setUploadResult(null);
		setUploadProgress(0);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5" />
						Bulk Chapter Upload
					</DialogTitle>
					<DialogDescription>Upload multiple chapters at once using JSON file.</DialogDescription>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3">
						{/* <TabsTrigger value="form">Form Input</TabsTrigger> */}
						<TabsTrigger value="json">JSON Upload</TabsTrigger>
						{/* <TabsTrigger value="csv">CSV Upload</TabsTrigger> */}
					</TabsList>

					<TabsContent value="form" className="space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium">Chapters ({chapters.length})</h3>
							<Button onClick={addChapter} size="sm">
								<Plus className="h-4 w-4 mr-2" />
								Add Chapter
							</Button>
						</div>

						<div className="space-y-4 max-h-96 overflow-y-auto">
							{chapters.map((chapter, index) => (
								<Card key={index}>
									<CardHeader className="pb-2">
										<div className="flex justify-between items-center">
											<CardTitle className="text-base">Chapter {index + 1}</CardTitle>
											{chapters.length > 1 && (
												<Button variant="ghost" size="sm" onClick={() => removeChapter(index)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										<div>
											<Label>Title *</Label>
											<Input value={chapter.title} onChange={(e) => updateChapter(index, "title", e.target.value)} placeholder="Chapter title" />
										</div>

										<div>
											<Label>Content *</Label>
											<MarkdownEditor
												value={chapter.content}
												onChange={(content) => updateChapter(index, "content", content)}
												placeholder="Write chapter content in markdown..."
												minHeight="200px"
											/>
										</div>

										<div className="grid grid-cols-2 gap-3">
											<div>
												<Label>Status</Label>
												<Select value={chapter.status} onValueChange={(value) => updateChapter(index, "status", value)}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="draft">Draft</SelectItem>
														<SelectItem value="published">Published</SelectItem>
														<SelectItem value="scheduled">Scheduled</SelectItem>
														<SelectItem value="private">Private</SelectItem>
													</SelectContent>
												</Select>
											</div>

											{chapter.status === "scheduled" && (
												<div>
													<Label>Scheduled Date</Label>
													<Input type="datetime-local" value={chapter.scheduledPublishDate} onChange={(e) => updateChapter(index, "scheduledPublishDate", e.target.value)} />
												</div>
											)}
										</div>

										<div>
											<Label>Notes</Label>
											<Textarea value={chapter.notes} onChange={(e) => updateChapter(index, "notes", e.target.value)} placeholder="Optional notes" rows={2} />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent value="json" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									JSON File Upload
								</CardTitle>
								<CardDescription>Upload a JSON file containing an array of chapter objects.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex gap-2">
									<Input type="file" accept=".json" onChange={handleFileUpload} className="flex-1" />
									<Button variant="outline" onClick={downloadTemplate}>
										<Download className="h-4 w-4 mr-2" />
										Template
									</Button>
								</div>

								<div className="text-sm text-muted-foreground">
									<p>JSON format example:</p>
									<pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
										{`[
  {
    "title": "Chapter 1",
    "content": "Chapter content...",
    "status": "draft",
    "notes": "Optional notes",
    "scheduledPublishDate": "2024-12-25T10:00"
  }
]`}
									</pre>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="csv" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									CSV File Upload
								</CardTitle>
								<CardDescription>Upload a CSV file with columns: title, content, status, notes, scheduledPublishDate</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex gap-2">
									<Input type="file" accept=".csv" onChange={handleFileUpload} className="flex-1" />
									<Button variant="outline" onClick={downloadTemplate}>
										<Download className="h-4 w-4 mr-2" />
										Template
									</Button>
								</div>

								<div className="text-sm text-muted-foreground">
									<p>CSV format requirements:</p>
									<ul className="list-disc list-inside mt-1 space-y-1">
										<li>First row must contain headers: title, content, status, notes, scheduledPublishDate</li>
										<li>Wrap text containing commas in double quotes</li>
										<li>Status options: draft, published, scheduled, private</li>
										<li>Date format: YYYY-MM-DDTHH:MM</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{errors.length > 0 && (
					<Card className="border-destructive">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-destructive flex items-center gap-2">
								<AlertTriangle className="h-4 w-4" />
								Validation Errors
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="text-sm text-destructive space-y-1">
								{errors.map((error, index) => (
									<li key={index}>• {error}</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}

				{uploadResult && (
					<Card className={uploadResult.success ? "border-green-500" : "border-destructive"}>
						<CardContent className="pt-4">
							<div className={`flex items-center gap-2 ${uploadResult.success ? "text-green-700" : "text-destructive"}`}>
								{uploadResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
								<span className="font-medium">{uploadResult.message}</span>
							</div>
							{uploadResult.success && uploadResult.summary && (
								<div className="mt-2 text-sm text-muted-foreground">
									<p>Created {uploadResult.summary.total} chapters:</p>
									<div className="flex gap-4 mt-1">
										{uploadResult.summary.drafts > 0 && <Badge variant="secondary">{uploadResult.summary.drafts} Draft</Badge>}
										{uploadResult.summary.published > 0 && <Badge variant="default">{uploadResult.summary.published} Published</Badge>}
										{uploadResult.summary.scheduled > 0 && <Badge variant="outline">{uploadResult.summary.scheduled} Scheduled</Badge>}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{isUploading && (
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Uploading chapters...</span>
							<span>{uploadProgress}%</span>
						</div>
						<Progress value={uploadProgress} className="h-2" />
					</div>
				)}

				<div className="flex justify-end gap-2 pt-4">
					<Button variant="outline" onClick={handleClose} disabled={isUploading}>
						Cancel
					</Button>
					<Button onClick={handleUpload} disabled={isUploading || chapters.length === 0}>
						{isUploading ? "Uploading..." : `Upload ${chapters.length} Chapter${chapters.length !== 1 ? "s" : ""}`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
