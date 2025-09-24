"use client";
import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Loader2, Chrome, Facebook, MessageCircle } from "lucide-react";
import Image from "next/image";

function SignInContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/";
	const error = searchParams.get("error");

	const [isLoading, setIsLoading] = useState(false);
	const [socialLoading, setSocialLoading] = useState("");
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [formError, setFormError] = useState("");

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear errors when user starts typing
		if (formError) setFormError("");
	};

	const handleCredentialsSignIn = async (e) => {
		e.preventDefault();

		if (!formData.email || !formData.password) {
			setFormError("Please fill in all fields");
			return;
		}

		setIsLoading(true);
		setFormError("");

		try {
			const result = await signIn("credentials", {
				email: formData.email,
				password: formData.password,
				redirect: false,
			});

			if (result?.error) {
				setFormError("Invalid email or password");
			} else if (result?.ok) {
				// Refresh session and redirect
				await getSession();
				router.push(callbackUrl);
				router.refresh();
			}
		} catch (error) {
			console.error("Sign in error:", error);
			setFormError("An error occurred during sign in");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSocialSignIn = async (provider) => {
		setSocialLoading(provider);

		try {
			await signIn(provider, {
				callbackUrl,
				redirect: true,
			});
		} catch (error) {
			console.error(`${provider} sign in error:`, error);
			setSocialLoading("");
		}
	};

	const getErrorMessage = (error) => {
		switch (error) {
			case "CredentialsSignin":
				return "Invalid email or password";
			case "OAuthSignin":
			case "OAuthCallback":
			case "OAuthCreateAccount":
				return "Error signing in with social provider";
			case "EmailCreateAccount":
				return "Could not create account with this email";
			case "Callback":
				return "Authentication error occurred";
			case "OAuthAccountNotLinked":
				return "Account linking is now enabled. Please clear your browser cache and try again.";
			case "EmailSignin":
				return "Unable to send verification email";
			case "CredentialsSignup":
				return "Unable to create account";
			default:
				return "Authentication error occurred";
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<Link href="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80">
						<Image src="/images/midnight-thought.png" alt="Midnight Thought" width={150} height={100} className="h-auto w-28" />
					</Link>
					<h1 className="text-2xl font-semibold mt-6 mb-2">Welcome back</h1>
					<p className="text-muted-foreground">Sign in to your account to continue</p>
				</div>

				<Card>
					<CardHeader className="text-center">
						<CardTitle>Sign In</CardTitle>
						<CardDescription>Choose your preferred sign-in method</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Error Alert */}
						{(error || formError) && (
							<Alert variant="destructive">
								<AlertDescription>{error ? getErrorMessage(error) : formError}</AlertDescription>
							</Alert>
						)}

						{/* Social Sign In Options */}
						<div className="space-y-3">
							<Button variant="outline" className="w-full" onClick={() => handleSocialSignIn("google")} disabled={socialLoading === "google"}>
								{socialLoading === "google" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Chrome className="h-4 w-4 mr-2" />}
								Continue with Google
							</Button>

							<Button variant="outline" className="w-full" onClick={() => handleSocialSignIn("facebook")} disabled={socialLoading === "facebook"}>
								{socialLoading === "facebook" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Facebook className="h-4 w-4 mr-2" />}
								Continue with Facebook
							</Button>

							<Button variant="outline" className="w-full" onClick={() => handleSocialSignIn("reddit")} disabled={socialLoading === "reddit"}>
								{socialLoading === "reddit" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
								Continue with Reddit
							</Button>
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<Separator className="w-full" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
							</div>
						</div>

						{/* Email/Password Form */}
						<form onSubmit={handleCredentialsSignIn} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input id="email" name="email" type="email" placeholder="Enter your email" className="pl-10" value={formData.email} onChange={handleInputChange} disabled={isLoading} required />
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input id="password" name="password" type="password" placeholder="Enter your password" className="pl-10" value={formData.password} onChange={handleInputChange} disabled={isLoading} required />
								</div>
							</div>

							<div className="flex items-center justify-between">
								<Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
									Forgot password?
								</Link>
							</div>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Signing in...
									</>
								) : (
									"Sign In"
								)}
							</Button>
						</form>

						<div className="text-center text-sm">
							<span className="text-muted-foreground">Don&apos;t have an account? </span>
							<Link href="/auth/signup" className="text-primary hover:underline">
								Sign up
							</Link>
						</div>
					</CardContent>
				</Card>

				<p className="text-center text-xs text-muted-foreground mt-4">
					By signing in, you agree to our{" "}
					<Link href="/terms" className="hover:underline">
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link href="/privacy" className="hover:underline">
						Privacy Policy
					</Link>
				</p>
			</div>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		}>
			<SignInContent />
		</Suspense>
	);
}
