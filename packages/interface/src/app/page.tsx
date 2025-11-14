import * as React from "react";
import { cn } from "@/lib/utils";
import { Leaderboard } from "./_components/leaderboard";
import { LeaderboardSkeleton } from "./_components/skeleton";

type Props = {
	searchParams: Promise<{
		theme: "light" | "dark";
		address?: string;
		localTz?: string;
	}>;
};

export default async function HomePage({ searchParams }: Props) {
	const { theme, address, localTz } = await searchParams;
	const parsedLocalTz = localTz === "true";

	return (
		<main className={cn("h-dvh overflow-auto w-full bg-base-bg", theme)}>
			<React.Suspense fallback={<LeaderboardSkeleton />}>
				<Leaderboard
					address={address}
					localTz={parsedLocalTz}
				/>
			</React.Suspense>
		</main>
	);
}
