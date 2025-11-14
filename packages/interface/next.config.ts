import type { NextConfig } from "next";
import type { Header } from "next/dist/lib/load-custom-routes";

const defaultHeaders: Header[] = [
	{
		source: "/:path*",
		headers: [
			{
				key: "Referrer-Policy",
				value: "strict-origin-when-cross-origin",
			},
			{
				key: "Permissions-Policy",
				value: "camera=(), microphone=(), geolocation=()",
			},
			{
				key: "X-Content-Type-Options",
				value: "nosniff",
			},
			{
				key: "Cross-Origin-Embedder-Policy",
				value: "unsafe-none",
			},
			{
				key: "Cross-Origin-Opener-Policy",
				value: "same-origin",
			},
			{
				key: "Cross-Origin-Resource-Policy",
				value: "cross-origin",
			},
			{
				key: "X-XSS-Protection",
				value: "1; mode=block",
			},
			{
				key: "Strict-Transport-Security",
				value: "max-age=63072000; includeSubDomains; preload",
			},
			{
				key: "X-DNS-Prefetch-Control",
				value: "on",
			},
		],
	},
];

const nextConfig: NextConfig = {
	experimental: {
		reactCompiler: true,
		inlineCss: true,
	},
	images: {
		domains: ["asset-logos.minswap.org", "asset-logos-testnet.minswap.org"],
		deviceSizes: [640, 768, 1024, 1280, 1536],
	},
	async headers() {
		if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
			defaultHeaders[0].headers.push({
				key: "Content-Security-Policy",
				value: `script-src 'self' 'unsafe-inline' 'unsafe-eval' minswap.org *.minswap.org *.posthog.com https://ajax.cloudflare.com https://vercel.live https://onesignal.com https://cdn.onesignal.com https://www.googletagmanager.com data:; frame-ancestors 'self' minswap.org *.minswap.org https://staging.eternl.io/ https://beta.eternl.io/ https://eternl.io/ https://dexscreener.com/ ionic: capacitor: chrome-extension: http://localhost:*/ https://localhost:*/;`,
			});
		}
		return defaultHeaders;
	},
};

export default nextConfig;
