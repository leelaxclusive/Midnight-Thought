import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Users, Heart } from "lucide-react";

export default function TermsPage() {
	const lastUpdated = "December 2025";

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Header */}
			<section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="flex justify-center mb-6">
						<FileText className="h-12 w-12 text-primary" />
					</div>
					<h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
					<p className="text-lg text-muted-foreground">Simple, fair terms for using Midnight Thought</p>
					<Badge variant="secondary" className="mt-4">
						Last updated: {lastUpdated}
					</Badge>
				</div>
			</section>

			{/* Content */}
			<section className="py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
					{/* About These Terms */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Heart className="h-5 w-5 text-primary" />
								About These Terms
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>Midnight Thought is Leela&apos;s passion project - built by a part-time erotic and romantic writer with help from amazing tech friends. These terms are kept simple and fair - no corporate legal nonsense.</p>
							<p>By using Midnight Thought, you agree to these terms. If something doesn&apos;t seem right or fair, please reach out on Discord so we can chat about it!</p>
						</CardContent>
					</Card>

					{/* What You Can Do */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-primary" />
								What You Can Do
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>
								<strong>You can:</strong>
							</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Write and publish your original stories</li>
								<li>Read and comment on other people&apos;s stories</li>
								<li>Create your profile and connect with other writers</li>
								<li>Share feedback and suggestions for the platform</li>
								<li>Use the platform for personal, non-commercial purposes</li>
							</ul>
						</CardContent>
					</Card>

					{/* What You Can't Do */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-primary" />
								What You Can&apos;t Do
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>
								<strong>Please don&apos;t:</strong>
							</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Post content that isn&apos;t yours (plagiarism)</li>
								<li>Be mean, harass, or bully other users</li>
								<li>Post spam, illegal content, or harmful material</li>
								<li>Try to break or hack the platform</li>
								<li>Create fake accounts or impersonate others</li>
								<li>Use the platform for commercial purposes without permission</li>
							</ul>
						</CardContent>
					</Card>

					{/* Your Content */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5 text-primary" />
								Your Content & Rights
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>
								<strong>You own your stories.</strong> When you publish content on Midnight Thought, you retain full ownership and copyright of your work.
							</p>
							<p>By posting content, you give Midnight Thought permission to display, store, and share your content on the platform. You can delete your content anytime, and we&apos;ll remove it from the platform.</p>
							<p>You&apos;re responsible for your content. Make sure you have the right to post everything you share, and that it doesn&apos;t violate anyone else&apos;s rights.</p>
						</CardContent>
					</Card>

					{/* Platform Availability */}
					<Card>
						<CardHeader>
							<CardTitle>Platform & Availability</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>Midnight Thought is provided &quot;as is&quot; - Leela does her best to keep it running smoothly, but sometimes things break or need maintenance (and that&apos;s when the tech friends come to the rescue!).</p>
							<p>As a personal passion project, I can&apos;t guarantee 100% uptime or that the platform will always be available. I&apos;ll do my best to communicate about any planned downtime or major changes in our Discord community.</p>
							<p>I may need to modify or discontinue features, but I&apos;ll try to give advance notice when possible and always keep the community in the loop.</p>
						</CardContent>
					</Card>

					{/* Privacy & Data */}
					<Card>
						<CardHeader>
							<CardTitle>Privacy & Your Data</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>Leela respects your privacy completely. As an erotic writer myself, I understand how important privacy is, especially for those sharing intimate or personal stories. I only collect the information needed to make the platform work.</p>
							<p>I&apos;ll never sell your data or use it for anything shady. Your information is used solely to provide the Midnight Thought service - and honestly, I&apos;m too busy writing stories to do anything else with it!</p>
							<p>If you want to delete your account and data, just ask on Discord and I&apos;ll take care of it for you personally.</p>
						</CardContent>
					</Card>

					{/* Changes to Terms */}
					<Card>
						<CardHeader>
							<CardTitle>Changes to These Terms</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>I may update these terms occasionally to keep them fair and current. If I make significant changes, I&apos;ll post about it on the platform and in our Discord community.</p>
							<p>Continued use of Midnight Thought after changes means you accept the updated terms.</p>
						</CardContent>
					</Card>

					{/* Contact */}
					<Card>
						<CardHeader>
							<CardTitle>Questions or Problems?</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>If you have questions about these terms, found a bug, or want to suggest improvements, please reach out on our Discord server. I&apos;m always happy to chat and make things better.</p>
							<p>Midnight Thought is built by and for the community - your feedback helps make it a better place for everyone.</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<Footer />
		</div>
	);
}
