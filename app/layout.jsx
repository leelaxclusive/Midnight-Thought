import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/lib/theme-context";
import AutoPublisher from "@/components/AutoPublisher";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata = {
	title: "Midnight Thought - Share Your Stories",
	description: "A digital storytelling platform where writers and readers connect through creative writing.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} font-sans antialiased`}>
				<ThemeProvider>
					<SessionProvider>
						<AutoPublisher />
						{children}
					</SessionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
