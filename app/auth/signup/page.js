"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Mail, Lock, User, Loader2, Chrome, Facebook, MessageCircle } from "lucide-react";
import Image from "next/image";
export default function SignUp() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [socialLoading, setSocialLoading] = useState(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const message = searchParams.get("message");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					password: formData.password,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				router.push("/auth/signin?message=Registration successful! Please sign in.");
			} else {
				setError(data.error || "Registration failed");
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSocialSignIn = async (provider) => {
		try {
			setSocialLoading(provider);
			setError("");
			await signIn(provider, { callbackUrl: "/dashboard" });
		} catch (error) {
			setError(`Failed to sign up with ${provider}. Please try again.`);
		} finally {
			setSocialLoading(null);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<Link href="/" className="block mx-auto my-0 text-primary hover:opacity-80">
						<Image src="/images/midnight-thought.png" alt="Midnight Thought" width={150} height={100} className="h-auto w-28" />
					</Link>
					<CardTitle className="text-2xl font-bold text-primary">Join Midnight Thought</CardTitle>
					<CardDescription>Create your account and start sharing your stories</CardDescription>
				</CardHeader>
				<CardContent>
					{message && (
						<Alert className="mb-4">
							<AlertDescription>{message}</AlertDescription>
						</Alert>
					)}

					{/* Social Sign Up Options */}
					<div className="space-y-3 mb-6">
						<Button variant="outline" size="lg" className="w-full relative" onClick={() => handleSocialSignIn("google")} disabled={socialLoading !== null}>
							{socialLoading === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
							Continue with Google
						</Button>

						<Button variant="outline" size="lg" className="w-full relative" onClick={() => handleSocialSignIn("facebook")} disabled={socialLoading !== null}>
							{socialLoading === "facebook" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
							Continue with Facebook
						</Button>

						<Button variant="outline" size="lg" className="w-full relative" onClick={() => handleSocialSignIn("reddit")} disabled={socialLoading !== null}>
							{socialLoading === "reddit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
							Continue with Reddit
						</Button>
					</div>

					<div className="relative mb-6">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Enter your full name" />
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Enter your email" />
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="Create a password" minLength={6} />
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" minLength={6} />
						</div>

						<Button type="submit" className="w-full" disabled={loading || socialLoading !== null}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Create Account
								</>
							)}
						</Button>
					</form>

					<div className="mt-6 text-center text-sm">
						<span className="text-muted-foreground">Already have an account? </span>
						<Link href="/auth/signin" className="text-primary hover:underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
