import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import RedditProvider from "next-auth/providers/reddit";
import connectDB from "./mongodb";
import User from "@/models/User";
import { generateUniqueUsername } from "./username-generator";

export const authOptions = {
	// Remove adapter to allow custom user management
	// adapter: MongoDBAdapter(clientPromise),
	// Allow the same email to be used with multiple sign-in methods
	allowDangerousEmailAccountLinking: true,
	// Additional debug configuration
	debug: process.env.NODE_ENV === "development",
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		FacebookProvider({
			clientId: process.env.FACEBOOK_CLIENT_ID,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
		}),
		RedditProvider({
			clientId: process.env.REDDIT_CLIENT_ID,
			clientSecret: process.env.REDDIT_CLIENT_SECRET,
		}),
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Invalid credentials");
				}

				try {
					await connectDB();

					const user = await User.findOne({ email: credentials.email });
					if (!user) {
						throw new Error("User not found");
					}

					const isValidPassword = await user.comparePassword(credentials.password);
					if (!isValidPassword) {
						throw new Error("Invalid password");
					}

					return {
						id: user._id.toString(),
						email: user.email,
						name: user.name,
						username: user.username,
						avatar: user.avatar,
						role: user.role,
					};
				} catch (error) {
					console.error("Auth error:", error);
					throw new Error("Authentication failed");
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
	},
	pages: {
		signIn: "/auth/signin",
		signUp: "/auth/signup",
	},
	callbacks: {
		async signIn({ user, account, profile }) {
			// Handle social login user creation
			if (account?.provider !== "credentials") {
				try {
					await connectDB();

					// Check if user already exists in our User model
					let existingUser = await User.findOne({ email: user.email });

					if (!existingUser) {
						// Generate unique username
						const username = await generateUniqueUsername(user.name || user.email?.split("@")[0]);

						// Create new user in our User model
						existingUser = new User({
							name: user.name || "User",
							email: user.email,
							username,
							avatar: user.image || "",
							role: "reader",
							isVerified: account.provider === "google", // Auto-verify Google users
							emailVerified: new Date(),
							// Social login users don't have passwords
							password: null,
						});

						await existingUser.save();

						// Update the user object with our generated data
						user.id = existingUser._id.toString();
						user.username = username;
						user.role = "reader";
					} else {
						// User exists, update their info if needed
						let needsUpdate = false;

						if (!existingUser.avatar && user.image) {
							existingUser.avatar = user.image;
							needsUpdate = true;
						}

						if (!existingUser.emailVerified && account.provider === "google") {
							existingUser.emailVerified = new Date();
							existingUser.isVerified = true;
							needsUpdate = true;
						}

						if (needsUpdate) {
							await existingUser.save();
						}

						// Update the user object with existing user data
						user.id = existingUser._id.toString();
						user.username = existingUser.username;
						user.role = existingUser.role;
					}
				} catch (error) {
					console.error("Error in signIn callback:", error);
					return false;
				}
			}

			return true;
		},
		async jwt({ token, user, account }) {
			if (user) {
				token.id = user.id;
				token.username = user.username;
				token.role = user.role || "reader";
			}

			// For social logins, ensure we have the username from our database
			if (account?.provider !== "credentials" && !token.username) {
				try {
					await connectDB();
					const dbUser = await User.findOne({ email: token.email });
					if (dbUser) {
						token.username = dbUser.username;
						token.role = dbUser.role;
					}
				} catch (error) {
					console.error("Error fetching user in JWT callback:", error);
				}
			}

			return token;
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id || token.sub;
				session.user.username = token.username;
				session.user.role = token.role || "reader";
			}

			// Ensure we always have a username
			if (!session.user.username && session.user.email) {
				try {
					await connectDB();
					const dbUser = await User.findOne({ email: session.user.email });
					if (dbUser) {
						session.user.username = dbUser.username;
						session.user.role = dbUser.role;
					}
				} catch (error) {
					console.error("Error fetching user in session callback:", error);
				}
			}

			return session;
		},
	},
	events: {
		async createUser({ user }) {
			// This event is triggered when NextAuth creates a user via social login
			// The user creation logic is handled in the signIn callback above
		},
	},
};

export default NextAuth(authOptions);
