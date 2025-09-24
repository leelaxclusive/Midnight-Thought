import Link from "next/link";
import Image from "next/image";
export default function Footer() {
	const currentYear = new Date().getFullYear();

	const footerLinks = [
		{ name: "About", href: "/about" },
		{ name: "Terms", href: "/terms" },
		{ name: "Accessibility", href: "/accessibility" },
		{ name: "Contact", href: "/contact" },
		{ name: "Explore", href: "/explore" },
		{ name: "Write", href: "/write" },
	];

	return (
		<footer className="bg-background border-t py-8">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-center space-y-4">
					{/* Brand */}
					<div className="flex items-center space-x-2">
						<Image src="/images/midnight-thought.png" alt="Midnight Thought" width={150} height={100} className="h-auto w-28" />
					</div>

					{/* Links */}
					<div className="flex flex-wrap justify-center gap-6">
						{footerLinks.map((link, index) => (
							<Link key={index} href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
								{link.name}
							</Link>
						))}
					</div>

					{/* Copyright */}
					<div className="text-sm text-muted-foreground">© {currentYear} Midnight Thought. All rights reserved.</div>
				</div>
			</div>
		</footer>
	);
}
