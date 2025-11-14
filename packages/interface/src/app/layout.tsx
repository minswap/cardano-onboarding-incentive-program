import { Inter } from "next/font/google";
import type * as React from "react";

import "@/styles/global.css";
import { QueryProvider } from "./_providers/query-provider";

const inter = Inter({
	display: "swap",
	preload: true,
	variable: "--font-inter",
	subsets: ["latin"],
});

type Props = {
	children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
	return (
		<html
			className={inter.className}
			lang="en"
			suppressHydrationWarning={true}
		>
			<body>
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
	);
}
