"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Upload, Eye, Code2, Split, Maximize2, FileText, Home, Github, HelpCircle, CheckCircle, Type, Undo, Redo } from "lucide-react";
import Link from "next/link";
import { markdownToHtml } from "@/components/ui/markdown-editor";
import { VisualMarkdownEditor, htmlToMarkdown } from "@/components/ui/visual-markdown-editor";

export default function PublicMarkdownEditor() {
	const [markdown, setMarkdown] = useState(``);

	const [html, setHtml] = useState("");
	const [activeTab, setActiveTab] = useState("editor");
	const [copySuccess, setCopySuccess] = useState("");
	const [wordCount, setWordCount] = useState(0);
	const [charCount, setCharCount] = useState(0);

	// Undo/Redo state for raw editor
	const [undoStack, setUndoStack] = useState([]);
	const [redoStack, setRedoStack] = useState([]);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);

	const fileInputRef = useRef(null);
	const textareaRef = useRef(null);
	const lastChangeTime = useRef(Date.now());

	// Update HTML and stats when markdown changes
	useEffect(() => {
		const htmlOutput = markdownToHtml(markdown);
		setHtml(htmlOutput);

		// Calculate statistics
		const words = markdown
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
		setWordCount(words);
		setCharCount(markdown.length);
	}, [markdown]);

	// Update undo/redo button states
	useEffect(() => {
		setCanUndo(undoStack.length > 0);
		setCanRedo(redoStack.length > 0);
	}, [undoStack, redoStack]);

	// Add to undo stack with debouncing (avoid too many entries)
	const addToUndoStack = (value) => {
		const now = Date.now();
		// Only add to undo stack if enough time has passed (1 second) or significant change
		if (now - lastChangeTime.current > 1000 || Math.abs(value.length - markdown.length) > 10) {
			setUndoStack((prev) => [...prev.slice(-49), markdown]); // Keep last 50 states
			setRedoStack([]); // Clear redo stack when new change is made
			lastChangeTime.current = now;
		}
	};

	// Undo function
	const handleUndo = () => {
		if (undoStack.length > 0) {
			const previousState = undoStack[undoStack.length - 1];
			setRedoStack((prev) => [markdown, ...prev.slice(0, 49)]); // Add current state to redo
			setUndoStack((prev) => prev.slice(0, -1)); // Remove last state from undo
			setMarkdown(previousState);
		}
	};

	// Redo function
	const handleRedo = () => {
		if (redoStack.length > 0) {
			const nextState = redoStack[0];
			setUndoStack((prev) => [...prev.slice(-49), markdown]); // Add current state to undo
			setRedoStack((prev) => prev.slice(1)); // Remove first state from redo
			setMarkdown(nextState);
		}
	};

	// Handle visual editor changes
	const handleVisualEditorChange = (newMarkdown) => {
		addToUndoStack(newMarkdown);
		setMarkdown(newMarkdown);
	};

	// Handle raw editor changes
	const handleRawEditorChange = (e) => {
		const newValue = e.target.value;
		addToUndoStack(newValue);
		setMarkdown(newValue);
	};

	// Handle keyboard shortcuts
	const handleKeyDown = (e) => {
		if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
			if (e.key === "z") {
				e.preventDefault();
				handleUndo();
			} else if (e.key === "y") {
				e.preventDefault();
				handleRedo();
			}
		}
		// Handle Ctrl+Shift+Z for redo (alternative)
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") {
			e.preventDefault();
			handleRedo();
		}
	};

	// Copy functionality
	const copyToClipboard = async (text, type) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopySuccess(type);
			setTimeout(() => setCopySuccess(""), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// File operations
	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file && file.type === "text/plain") {
			const reader = new FileReader();
			reader.onload = (e) => {
				setMarkdown(e.target.result);
			};
			reader.readAsText(file);
		}
	};

	const downloadFile = (content, filename, type) => {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	const insertAtCursor = (before, after = "") => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = markdown.substring(start, end);

		const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);

		setMarkdown(newText);

		// Restore cursor position
		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + before.length + selectedText.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	const toolbarButtons = [
		{ icon: "H1", action: () => insertAtCursor("\n# "), tooltip: "Heading 1" },
		{ icon: "H2", action: () => insertAtCursor("\n## "), tooltip: "Heading 2" },
		{ icon: "B", action: () => insertAtCursor("**", "**"), tooltip: "Bold" },
		{ icon: "I", action: () => insertAtCursor("*", "*"), tooltip: "Italic" },
		{ icon: "Code", action: () => insertAtCursor("`", "`"), tooltip: "Inline Code" },
		{ icon: "Quote", action: () => insertAtCursor("\n> "), tooltip: "Quote" },
		{ icon: "List", action: () => insertAtCursor("\n- "), tooltip: "Unordered List" },
		{ icon: "NumList", action: () => insertAtCursor("\n1. "), tooltip: "Ordered List" },
		{ icon: "Link", action: () => insertAtCursor("[", "](url)"), tooltip: "Link" },
		{ icon: "Image", action: () => insertAtCursor("![alt](", ")"), tooltip: "Image" },
		{ icon: Undo, action: handleUndo, tooltip: "Undo (Ctrl+Z)", disabled: !canUndo },
		{ icon: Redo, action: handleRedo, tooltip: "Redo (Ctrl+Y)", disabled: !canRedo },
	];

	return (
		<div className="min-h-screen bg-background flex flex-col">
			{/* Header */}
			<header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
				<div className="flex items-center justify-between px-6 py-3">
					<div className="flex items-center space-x-4">
						<Link href="/" className="flex items-center space-x-2 hover:opacity-80">
							<Home className="h-5 w-5" />
							<span className="font-semibold">Home</span>
						</Link>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex overflow-hidden">
				{/* Mobile View */}
				<div className="md:hidden flex-1 flex flex-col">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
						<div className="border-b border-border px-4">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="editor">Split Editor</TabsTrigger>
								<TabsTrigger value="preview">Copy & Export</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="editor" className="flex-1 flex flex-col m-0 p-0">
							{/* Mobile Split View - Stacked Vertically */}

							{/* Visual Editor - Top Half */}
							<div className="flex-1 flex flex-col border-b border-border">
								<div className="border-b border-border bg-muted/30 p-2">
									<Badge variant="secondary" className="text-xs">
										Visual Editor
									</Badge>
								</div>
								<div className="flex-1">
									<VisualMarkdownEditor value={markdown} onChange={handleVisualEditorChange} placeholder="Start writing your content..." className="h-full border-0 rounded-none" minHeight="100%" />
								</div>
							</div>

							{/* Raw Editor - Bottom Half */}
							<div className="flex-1 flex flex-col">
								<div className="border-b border-border bg-muted/30 p-2">
									<div className="flex items-center justify-between mb-2">
										<Badge variant="secondary" className="text-xs">
											Raw Markdown
										</Badge>
										<div className="text-xs text-muted-foreground">
											{wordCount} words • {charCount} characters
										</div>
									</div>
									<div className="flex flex-wrap gap-1">
										{toolbarButtons.map((button, index) => {
											const IconComponent = typeof button.icon === "string" ? null : button.icon;
											return (
												<Button key={index} variant="ghost" size="sm" onClick={button.action} title={button.tooltip} disabled={button.disabled} className="h-7 px-2 text-xs">
													{IconComponent ? <IconComponent className="h-3 w-3" /> : button.icon}
												</Button>
											);
										})}
									</div>
								</div>

								<Textarea ref={textareaRef} value={markdown} onChange={handleRawEditorChange} onKeyDown={handleKeyDown} placeholder="Raw markdown appears here..." className="flex-1 border-0 resize-none focus:ring-0 rounded-none font-mono text-sm" />
							</div>
						</TabsContent>

						<TabsContent value="preview" className="flex-1 m-0 p-0">
							<div className="border-b border-border p-2 bg-muted/30">
								<div className="flex items-center justify-between">
									<Badge variant="secondary">Preview</Badge>
									<div className="flex space-x-1">
										<Button variant="ghost" size="sm" onClick={() => copyToClipboard(html, "html")} className="text-xs">
											{copySuccess === "html" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
											HTML
										</Button>
										<Button variant="ghost" size="sm" onClick={() => copyToClipboard(markdown, "markdown")} className="text-xs">
											{copySuccess === "markdown" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
											MD
										</Button>
									</div>
								</div>
							</div>

							<div className="flex-1 overflow-auto">
								<div className="p-6 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
							</div>
						</TabsContent>
					</Tabs>
				</div>

				{/* Desktop View - Split Screen */}
				<div className="hidden md:flex flex-1">
					{/* Visual Editor - Left Side */}
					<div className="w-1/2 flex flex-col border-r border-border">
						<div className="border-b border-border bg-muted/30 p-3">
							<div className="flex items-center justify-between">
								<Badge variant="secondary">Visual Editor</Badge>
								<div className="text-xs text-muted-foreground">WYSIWYG Editor</div>
							</div>
						</div>

						<div className="flex-1">
							<VisualMarkdownEditor value={markdown} onChange={handleVisualEditorChange} placeholder="Start writing your content..." className="h-full border-0 rounded-none" minHeight="100%" />
						</div>
					</div>

					{/* Raw Editor - Right Side */}
					<div className="w-1/2 flex flex-col">
						<div className="border-b border-border bg-muted/30 p-3">
							<div className="flex items-center justify-between mb-2">
								<Badge variant="secondary">Raw Markdown</Badge>
								<div className="text-xs text-muted-foreground">
									{wordCount} words • {charCount} characters
								</div>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex flex-wrap gap-1">
									{toolbarButtons.map((button, index) => {
										const IconComponent = typeof button.icon === "string" ? null : button.icon;
										return (
											<Button key={index} variant="ghost" size="sm" onClick={button.action} title={button.tooltip} disabled={button.disabled} className="h-7 px-2 text-xs">
												{IconComponent ? <IconComponent className="h-3 w-3" /> : button.icon}
											</Button>
										);
									})}
								</div>

								<div className="flex space-x-1">
									<Button variant="ghost" size="sm" onClick={() => copyToClipboard(html, "html")} className="text-xs">
										{copySuccess === "html" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
										HTML
									</Button>
									<Button variant="ghost" size="sm" onClick={() => copyToClipboard(markdown, "markdown")} className="text-xs">
										{copySuccess === "markdown" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
										MD
									</Button>
								</div>
							</div>
						</div>

						<Textarea ref={textareaRef} value={markdown} onChange={handleRawEditorChange} onKeyDown={handleKeyDown} placeholder="Raw markdown appears here..." className="flex-1 border-0 resize-none focus:ring-0 rounded-none font-mono text-sm leading-relaxed" />
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border bg-muted/30 px-6 py-3">
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<div className="flex items-center space-x-4">
						<span>Free Markdown Editor</span>
						<Link href="/about" className="hover:text-foreground">
							About
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
