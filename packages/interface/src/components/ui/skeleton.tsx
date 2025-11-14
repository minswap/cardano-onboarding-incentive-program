import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-2xl bg-base-bg border border-bd-pri-sub", className)}
			{...props}
		/>
	);
}

export { Skeleton };
