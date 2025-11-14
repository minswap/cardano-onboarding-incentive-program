import { Divider } from "@/components/divider";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROW_COUNT = 10;

export function RankTableSkeleton() {
	return (
		<div className="space-y-2">
			<div className="bg-base-bg">
				<div className="hidden grid-cols-[96px_1fr_1fr_1fr_1fr] lg:grid rounded-lg bg-sf-pri-sub text-label-sm-sec text-itr-tent-pri-sub [&>div]:px-4 [&>div]:py-3">
					<div>Place</div>
					<div>Wallet</div>
					<div className="text-right">Points</div>
					<div className="text-right">Most traded</div>
					<div className="text-right">Est. reward</div>
				</div>
			</div>
			<ul>
				{Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Using index as key for skeleton rows is acceptable here
					<li key={index}>
						<MobileRowSkeleton />
						<DesktopRowSkeleton />
						{index + 1 !== SKELETON_ROW_COUNT ? (
							<Divider className="w-[calc(100%-2rem)] -mb-[1px] mx-auto bg-bd-pri-ter lg:hidden block" />
						) : null}
					</li>
				))}
			</ul>
		</div>
	);
}

function MobileRowSkeleton() {
	return (
		<div className="px-2 py-3 rounded-xl flex flex-col gap-3 lg:hidden">
			<div className="flex items-center gap-2">
				<Skeleton className="w-10 h-4 rounded-full" />
				<div className="flex-1 flex gap-2 items-center">
					<Skeleton className="w-7 h-7 rounded-full" />
					<Skeleton className="w-32 h-4 rounded-full" />
					<Skeleton className="w-12 h-6 rounded-full" />
				</div>
				<div className="flex items-end flex-col gap-1">
					<Skeleton className="w-14 h-4 rounded-full" />
					<Skeleton className="w-16 h-5 rounded-full" />
				</div>
			</div>
			<div className="flex items-center gap-3">
				<div className="w-10" />
				<div className="flex flex-1 items-start flex-col gap-1">
					<Skeleton className="w-18 h-4 rounded-full" />
					<div className="flex -space-x-2 ">
						<Skeleton className="h-6 w-6 rounded-full border-bd-pri-df" />
						<Skeleton className="h-6 w-6 rounded-full border-bd-pri-df" />
						<Skeleton className="h-6 w-6 rounded-full border-bd-pri-df" />
					</div>
				</div>
				<div className="flex items-end flex-col gap-1">
					<Skeleton className="w-20 h-4 rounded-full" />
					<Skeleton className="w-16 h-5 rounded-full" />
				</div>
			</div>
		</div>
	);
}

function DesktopRowSkeleton() {
	return (
		<div className="grid-cols-[96px_1fr_1fr_1fr_1fr] items-center rounded-lg text-label-sm-sec text-itr-tent-pri-df [&>div]:px-4 [&>div]:py-3 hidden lg:grid">
			<Skeleton className="h-4 w-10" />

			<div className="flex items-center gap-2">
				<Skeleton className="h-7 w-7 rounded-full" />
				<Skeleton className="h-4 w-[120px]" />
				<Skeleton className="w-12 h-6 rounded-full" />
			</div>

			<div className="flex items-center justify-end gap-2">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-4 w-4" />
			</div>

			<div className="flex -space-x-2 justify-end ">
				<Skeleton className="h-6 w-6 rounded-full border-2 border-bd-pri-df" />
				<Skeleton className="h-6 w-6 rounded-full border-2 border-bd-pri-df" />
				<Skeleton className="h-6 w-6 rounded-full border-2 border-bd-pri-df" />
			</div>

			<div className="flex items-center justify-end">
				<Skeleton className="h-4 w-20" />
			</div>
		</div>
	);
}
