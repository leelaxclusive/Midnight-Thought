import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink } from "lucide-react";

export default function ContactPage() {
	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Header */}
			<section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="flex justify-center mb-6">
						<MessageSquare className="h-12 w-12 text-primary" />
					</div>
					<h1 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
					<p className="text-lg text-muted-foreground">Join our Discord community to ask questions, report issues, or just chat!</p>
				</div>
			</section>

			<section className="py-12">
				<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
					<Card className="text-center">
						<CardHeader>
							<CardTitle className="flex items-center justify-center gap-2">
								<MessageSquare className="h-6 w-6 text-primary" />
								Join Our Discord Server
							</CardTitle>
							<CardDescription>Midnight Thought is Leela&apos;s passion project - built by a part-time erotic and romantic writer! The best way to reach me is through Discord where I hang out with fellow writers.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="p-6 bg-primary/5 rounded-lg">
								<h3 className="font-semibold text-lg mb-3">📢 How to Get Help</h3>
								<ol className="text-left space-y-2 text-muted-foreground">
									<li>1. Click the Discord link below to join our server</li>
									<li>
										2. Go to the <code className="bg-muted px-2 py-1 rounded text-sm">#support</code> channel
									</li>
									<li>3. Post your question, bug report, or feature request</li>
									<li>4. Leela will respond as soon as possible!</li>
								</ol>
							</div>

							<Button size="lg" className="w-full" asChild>
								<a href="https://discord.gg/your-discord-invite" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
									<ExternalLink className="h-5 w-5" />
									Join Discord Server
								</a>
							</Button>

							<div className="text-sm text-muted-foreground space-y-2">
								<p>
									<strong>Response Time:</strong> Usually within 24 hours, often much faster!
								</p>
								<p>
									<strong>What to include:</strong> Screenshots, error messages, and detailed descriptions help me help you faster.
								</p>
							</div>

							<div className="pt-6 border-t">
								<p className="text-sm text-muted-foreground">Midnight Thought is built with ❤️ by Leela with help from amazing tech friends. Your feedback and support mean everything to this part-time erotic romance writer!</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			<Footer />
		</div>
	);
}

// Metadata is handled in layout.js for client components
