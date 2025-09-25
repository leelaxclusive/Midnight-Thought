"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PenTool, Search, User, Settings, LogOut, Menu, X, Home, Library, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import Image from "next/image";

export default function Navbar() {
	const { data: session } = useSession();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};

	const navigation = [
		{ name: "Home", href: "/", icon: Home },
		{ name: "Explore", href: "/explore", icon: Search },
		{ name: "Write", href: "/write", icon: PenTool, authRequired: true },
		{ name: "Library", href: "/library", icon: Library, authRequired: true },
		{ name: "Support", href: "/support", icon: Heart },
	];

	return (
		<nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					{/* Logo */}
					<div className="flex items-center">
						<Link href="/" className="flex items-center space-x-2">
							<Image src="/images/midnight-thought.png" alt="Midnight Thought" width={150} height={100} className="h-auto w-28" />
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navigation.map((item) => {
							if (item.authRequired && !session) return null;
							return (
								<Link key={item.name} href={item.href} className="flex items-center space-x-1 text-foreground/80 hover:text-primary transition-colors">
									<item.icon className="h-4 w-4" />
									<span>{item.name}</span>
								</Link>
							);
						})}
					</div>

					{/* Right side */}
					<div className="hidden md:flex items-center space-x-4">
						<ThemeToggle />
						{session ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="relative h-8 w-8 rounded-full">
										<Avatar className="h-8 w-8">
											<AvatarImage src={session.user.avatar} alt={session.user.name} />
											<AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">{session.user.name}</p>
											<p className="text-xs leading-none text-muted-foreground">@{session.user.username}</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/dashboard" className="flex items-center">
											<User className="mr-2 h-4 w-4" />
											Dashboard
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/profile" className="flex items-center">
											<Settings className="mr-2 h-4 w-4" />
											Settings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut}>
										<LogOut className="mr-2 h-4 w-4" />
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<div className="flex items-center space-x-4">
								<Button variant="ghost" asChild>
									<Link href="/auth/signin">Sign In</Link>
								</Button>
								<Button asChild>
									<Link href="/auth/signup">Sign Up</Link>
								</Button>
							</div>
						)}
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center space-x-2">
						<ThemeToggle variant="simple" />
						<Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
							{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-t border-border">
					<div className="px-2 pt-2 pb-3 space-y-1">
						{navigation.map((item) => {
							if (item.authRequired && !session) return null;
							return (
								<Link key={item.name} href={item.href} className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
									<item.icon className="h-5 w-5" />
									<span>{item.name}</span>
								</Link>
							);
						})}
					</div>

					<div className="pt-4 pb-3 border-t border-border">
						{session ? (
							<div className="px-4 space-y-3">
								<div className="flex items-center space-x-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src={session.user.avatar} alt={session.user.name} />
										<AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
									</Avatar>
									<div>
										<div className="text-base font-medium">{session.user.name}</div>
										<div className="text-sm text-muted-foreground">@{session.user.username}</div>
									</div>
								</div>
								<div className="space-y-1">
									<Link href="/dashboard" className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
										<User className="h-5 w-5" />
										<span>Dashboard</span>
									</Link>
									<Link href="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
										<Settings className="h-5 w-5" />
										<span>Settings</span>
									</Link>
									<button onClick={handleSignOut} className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors">
										<LogOut className="h-5 w-5" />
										<span>Sign out</span>
									</button>
								</div>
							</div>
						) : (
							<div className="px-4 space-y-2">
								<Button variant="ghost" className="w-full justify-start" asChild>
									<Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
										Sign In
									</Link>
								</Button>
								<Button className="w-full" asChild>
									<Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
										Sign Up
									</Link>
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
		</nav>
	);
}
