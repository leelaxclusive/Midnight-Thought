import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Keyboard, Heart, Users } from "lucide-react";

export default function AccessibilityPage() {
	const lastUpdated = "December 2025";

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Header */}
			<section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="flex justify-center mb-6">
						<Shield className="h-12 w-12 text-primary" />
					</div>
					<h1 className="text-4xl font-bold text-foreground mb-4">Accessibility</h1>
					<p className="text-lg text-muted-foreground">Making Midnight Thought accessible for everyone</p>
					<Badge variant="secondary" className="mt-4">
						Last updated: {lastUpdated}
					</Badge>
				</div>
			</section>

			{/* Content */}
			<section className="py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
					{/* Our Commitment */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Heart className="h-5 w-5 text-primary" />
								Our Commitment
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>Midnight Thought is built by Leela, a part-time erotic writer who believes storytelling should be accessible to everyone. While the platform is still improving its accessibility features, I&apos;m committed to making it usable for people of all abilities.</p>
							<p>If you encounter barriers while using Midnight Thought, please reach out on Discord. Your feedback helps me understand what needs to be fixed or improved.</p>
						</CardContent>
					</Card>

					{/* Current Features */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="h-5 w-5 text-primary" />
								Accessibility Features
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>
								<strong>What&apos;s currently implemented:</strong>
							</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Semantic HTML structure for screen readers</li>
								<li>Keyboard navigation support</li>
								<li>High contrast text and colors</li>
								<li>Descriptive alt text for images</li>
								<li>Focus indicators for interactive elements</li>
								<li>Responsive design that works on different screen sizes</li>
								<li>Clean, simple layout without overwhelming animations</li>
							</ul>
						</CardContent>
					</Card>

					{/* Work in Progress */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Keyboard className="h-5 w-5 text-primary" />
								What I&apos;m Working On
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>
								<strong>Improvements in development:</strong>
							</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Better screen reader support for the story editor</li>
								<li>More comprehensive keyboard shortcuts</li>
								<li>Improved color contrast in all areas</li>
								<li>Font size controls</li>
								<li>Dark/light theme options</li>
								<li>Better error message handling</li>
								<li>More descriptive labels and instructions</li>
							</ul>
						</CardContent>
					</Card>

					{/* Standards */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-primary" />
								Accessibility Standards
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>I aim to meet Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards, though with help from tech friends, we&apos;re still working toward full compliance.</p>
							<p>The platform is tested with:</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Keyboard-only navigation</li>
								<li>Screen reader software (when possible)</li>
								<li>High contrast displays</li>
								<li>Different browser zoom levels</li>
							</ul>
						</CardContent>
					</Card>

					{/* Help & Feedback */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5 text-primary" />
								Help & Feedback
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>
								<strong>Need help or found an accessibility issue?</strong>
							</p>
							<p>Please join our Discord server and post in the #support channel. I&apos;m always eager to learn about accessibility barriers and fix them quickly.</p>
							<p>
								<strong>When reporting accessibility issues, please include:</strong>
							</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>What assistive technology you&apos;re using (if any)</li>
								<li>What browser you&apos;re using</li>
								<li>What you were trying to do</li>
								<li>What happened instead</li>
								<li>Any error messages you saw</li>
							</ul>
						</CardContent>
					</Card>

					{/* Technical Details */}
					<Card>
						<CardHeader>
							<CardTitle>Technical Implementation</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground space-y-4">
							<p>Midnight Thought is built by tech friends for Leela using modern web technologies that support accessibility:</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Next.js for server-side rendering and better performance</li>
								<li>Semantic HTML5 elements</li>
								<li>ARIA labels and roles where needed</li>
								<li>CSS that respects user preferences</li>
								<li>Progressive enhancement principles</li>
							</ul>
							<p>As the platform grows, this part-time erotic writer will continue working with tech friends to improve accessibility based on user feedback and best practices.</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<Footer />
		</div>
	);
}
