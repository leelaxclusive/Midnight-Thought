/** @type {import('next').NextConfig} */
const nextConfig = {
	// Image optimization
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "utfs.io",
				port: "",
				pathname: "/f/**",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "platform-lookaside.fbsbx.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "www.redditstatic.com",
				port: "",
				pathname: "/**",
			},
		],
		formats: ["image/webp", "image/avif"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 1, // 24 hours
		dangerouslyAllowSVG: true,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},

	// Performance optimizations
	compress: true,
	poweredByHeader: false,
	reactStrictMode: true,

	// Experimental features for better performance
	experimental: {
		optimizePackageImports: ["lucide-react"],
	},

	// Turbopack configuration
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},

	// Headers for caching and security
	async headers() {
		const isDev = process.env.NODE_ENV === "development";

		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
					// Disable caching in development
					...(isDev
						? [
								{
									key: "Cache-Control",
									value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
								},
						  ]
						: []),
				],
			},
			{
				source: "/api/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: isDev ? "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" : "no-store, max-age=0",
					},
				],
			},
			{
				source: "/_next/static/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: isDev ? "no-store, no-cache, must-revalidate, max-age=0" : "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
};

export default nextConfig;
