import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Heart, PenTool, Users, Code, Coffee } from "lucide-react";

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Hero Section */}
			<section className="relative py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="flex justify-center mb-6">
						<BookOpen className="h-16 w-16 text-primary" />
					</div>
					<h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
						About <span className="text-primary">Midnight Thought</span>
					</h1>
					<p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">A simple, personal passion project built for storytellers who want a place to share their creativity.</p>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Personal Story */}
					<Card className="mb-12">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Heart className="h-6 w-6 text-red-500" />
								Built with Love
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-muted-foreground">
							<p>Hi! I&apos;m Leela, a passionate writer who loves crafting erotic and romantic stories. As someone deeply immersed in the world of intimate storytelling, I wanted to create a platform where writers like me could share their work freely and connect with readers who appreciate these genres.</p>
							<p>This project was created with help from some amazing tech friends who brought my vision to life. What began as an idea has grown into something I&apos;m genuinely passionate about. I believe every story deserves a home, especially the intimate, romantic tales that often struggle to find proper platforms.</p>
							<p>Midnight Thought isn&apos;t backed by any company - it&apos;s just me, with lots of caffeine, and the dream of creating a welcoming space for storytellers who want to explore love, romance, and human connection through their words.</p>
						</CardContent>
					</Card>

					{/* What I'm Building */}
					<Card className="mb-12">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<PenTool className="h-6 w-6 text-primary" />
								What I&apos;m Building
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid md:grid-cols-3 gap-6">
								<div className="text-center">
									<PenTool className="h-8 w-8 text-primary mx-auto mb-3" />
									<h3 className="font-semibold mb-2">Simple Tools</h3>
									<p className="text-sm text-muted-foreground">Clean, distraction-free writing tools that just work</p>
								</div>
								<div className="text-center">
									<Users className="h-8 w-8 text-primary mx-auto mb-3" />
									<h3 className="font-semibold mb-2">Community</h3>
									<p className="text-sm text-muted-foreground">A welcoming place for writers and readers to connect</p>
								</div>
								<div className="text-center">
									<Heart className="h-8 w-8 text-primary mx-auto mb-3" />
									<h3 className="font-semibold mb-2">Personal Touch</h3>
									<p className="text-sm text-muted-foreground">Built by someone who actually cares about the community</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Technical Stack */}
					<Card className="mb-12">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Code className="h-6 w-6 text-primary" />
								How It&apos;s Built
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-muted-foreground">
							<p>For the curious developers out there, Midnight Thought is built with modern web technologies by my amazing tech friends:</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Next.js 15 for the frontend and API</li>
								<li>MongoDB for data storage</li>
								<li>NextAuth.js for authentication</li>
								<li>Tailwind CSS for styling</li>
								<li>Built with tech friends&apos; guidance and expertise</li>
								<li>Deployed with good vibes, caffeine, and determination ☕</li>
							</ul>
							<p>As a writer who had a vision, my tech friends have been incredible in bringing it to life! If you&apos;re a developer and want to contribute, please reach out on Discord!</p>
						</CardContent>
					</Card>

					{/* Get Involved */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Coffee className="h-6 w-6 text-primary" />
								Get Involved
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="text-muted-foreground space-y-4">
								<p>Midnight Thought is still growing, and I&apos;d love your help to make it better:</p>
								<ul className="list-disc list-inside space-y-2 ml-4">
									<li>Write and share your stories</li>
									<li>Read and support other writers</li>
									<li>Join our Discord community</li>
									<li>Report bugs and suggest features</li>
									<li>Spread the word to other storytellers</li>
								</ul>
								<p className="pt-4 border-t border-border">
									<strong>Open Source Project:</strong> Midnight Thought is an open source project! If you&apos;re a developer or designer who wants to help improve and update the platform, we&apos;d love your contributions. Check out our code on{" "}
									<a href="https://github.com/leelaxclusive/Midnight-Thought" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
										GitHub
									</a>{" "}
									or join our{" "}
									<a href="https://discord.gg/unDsDGHz92" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
										Discord
									</a>{" "}
									to connect with the development team and learn how you can get involved.
								</p>
							</div>

							<div className="flex flex-wrap gap-4 pt-6">
								<Button asChild>
									<Link href="/write">Start Writing</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="https://discord.gg/unDsDGHz92" target="_blank">
										Join Discord
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			<Footer />
		</div>
	);
}
