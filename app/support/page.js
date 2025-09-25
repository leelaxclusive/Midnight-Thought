"use client";
import { useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Coffee, Gift, Smartphone, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function SupportPage() {
	useEffect(() => {
		// Load Razorpay payment button script
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/payment-button.js";
		script.setAttribute("data-payment_button_id", "pl_Q3tjevIYyOm9ou");
		script.async = true;

		// Find the form element and append the script
		const form = document.getElementById("razorpay-form");
		if (form && !form.querySelector("script")) {
			form.appendChild(script);
		}

		// Cleanup function
		return () => {
			if (form && form.contains(script)) {
				form.removeChild(script);
			}
		};
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Header */}
			<section className="py-16 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-red-500/10">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="flex justify-center mb-6">
						<Heart className="h-16 w-16 text-red-500" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Support Midnight Thought</h1>
					<p className="text-xl text-muted-foreground mb-4">Keep the Conversations Alive</p>
					<p className="text-lg text-muted-foreground max-w-3xl mx-auto">Help Leela keep this passion project running and growing. Every contribution helps cover server costs, development, and keeps this community-driven platform free for all storytellers.</p>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Why Support Section */}
					<Card className="mb-12">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Coffee className="h-6 w-6 text-primary" />
								Why Your Support Matters
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-muted-foreground">
							<p>Hi! I&apos;m Leela, and Midnight Thought is my labor of love. As a part-time erotic romance writer, I created this platform to give our community a safe, welcoming space to share stories and connect with readers who appreciate our genre.</p>
							<p>Running a platform like this comes with real costs - servers, development, maintenance, and all the behind-the-scenes work that keeps everything running smoothly. Your support helps me:</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Keep the servers running and the site fast</li>
								<li>Add new features and improvements</li>
								<li>Maintain a spam-free, safe environment</li>
								<li>Cover development and hosting costs</li>
								<li>Focus more time on platform improvements</li>
								<li>Keep Midnight Thought completely free for writers and readers</li>
							</ul>
						</CardContent>
					</Card>

					{/* Support Options */}
					<div className="grid md:grid-cols-2 gap-8 mb-12">
						{/* Payment Buttons */}
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Gift className="h-5 w-5 text-primary" />
										One-Time Support
									</CardTitle>
									<CardDescription>Buy Leela a coffee (or a whole pot!) to show your appreciation</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="widget-container">
										<form id="razorpay-form" style={{ display: "block" }}>
											{/* Razorpay script will be loaded via useEffect */}
										</form>
										<a className="gumroad-button" href="https://midnightthought.gumroad.com/l/lcmop" target="_blank" data-gumroad-overlay-checkout="true">
											Support on
											<span className="logo-full"></span>
										</a>
									</div>

									<div className="text-center pt-2">
										<p className="text-sm text-muted-foreground">Every contribution, big or small, makes a difference! ❤️</p>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* QR Code Section */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Smartphone className="h-5 w-5 text-primary" />
									Quick Mobile Payment
								</CardTitle>
								<CardDescription>Scan with your phone for instant support</CardDescription>
							</CardHeader>
							<CardContent className="text-center space-y-4">
								<div className="mx-auto bg-muted rounded-lg flex items-center justify-center">
									{/* Placeholder for QR code - replace with actual QR code image */}
									<div className="text-center">
										<Image src="/images/QrCode.png" alt="QR Code" width={500} height={600} className="mx-auto w-80 h-auto" />
									</div>
								</div>
								<p className="text-sm text-muted-foreground">Scan this QR code with your mobile payment app to send support directly</p>
							</CardContent>
						</Card>
					</div>

					{/* Other Ways to Support */}
					<Card className="mb-12">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Heart className="h-6 w-6 text-primary" />
								Other Ways to Support (Free!)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid md:grid-cols-2 gap-6">
								<div className="space-y-3">
									<h3 className="font-semibold">Spread the Word</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Tell other writers about the platform</li>
										<li>• Share your favorite stories</li>
										<li>• Invite friends to join the community</li>
									</ul>
								</div>
								<div className="space-y-3">
									<h3 className="font-semibold">Stay Active</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Read and like stories you enjoy</li>
										<li>• Leave thoughtful comments</li>
										<li>• Engage with the Discord community</li>
									</ul>
								</div>
								<div className="space-y-3">
									<h3 className="font-semibold">Contribute Code</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Check our GitHub repository</li>
										<li>• Report bugs and issues</li>
										<li>• Suggest new features</li>
									</ul>
								</div>
								<div className="space-y-3">
									<h3 className="font-semibold">Create Content</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Write amazing stories</li>
										<li>• Share writing tips</li>
										<li>• Help new writers feel welcome</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Thank You Message */}
					<Card>
						<CardContent className="pt-6 text-center">
							<Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
							<h2 className="text-2xl font-bold mb-4">Thank You!</h2>
							<p className="text-muted-foreground max-w-2xl mx-auto">Whether you support financially, contribute code, spread the word, or simply participate in our community, you&apos;re helping keep Midnight Thought alive and thriving. Every story shared, every comment left, and every connection made helps build something beautiful.</p>
							<p className="text-muted-foreground mt-4 font-semibold">
								With love and gratitude,
								<br />
								Leela 💕
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<Footer />
		</div>
	);
}
