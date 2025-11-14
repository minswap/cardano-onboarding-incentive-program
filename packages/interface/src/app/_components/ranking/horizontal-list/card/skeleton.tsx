import { Skeleton } from "@/components/ui/skeleton";

export function RankerCardSkeleton() {
	return (
		<li className="p-6 min-h-48.5 min-w-80 bg-base-bg border rounded-[20px] flex flex-col gap-6 border-bd-pri-sub flex-1">
			<div className="flex justify-between">
				<div className="flex flex-col gap-2">
					<Skeleton className="w-11 h-11 rounded-full" />
					<div className="flex gap-2">
						<Skeleton className="w-24 h-6" />
						<Skeleton className="w-12 h-6" />
					</div>
				</div>
				<Skeleton className="w-12 h-6" />
			</div>
			<div className="flex justify-between">
				<div className="flex flex-col items-start gap-2">
					<Skeleton className="w-16 h-4" />
					<Skeleton className="w-20 h-4" />
				</div>
				<div className="flex flex-col items-end gap-1">
					<Skeleton className="w-16 h-4" />
					<div className="flex -space-x-2 justify-end ">
						<Skeleton className="h-6 w-6 rounded-full border-bd-pri-df" />
						<Skeleton className="h-6 w-6 rounded-full border-bd-pri-df" />
						<Skeleton className="h-6 w-6 rounded-full border-bd-pri-df" />
					</div>
				</div>
				<div className="flex flex-col items-end gap-2">
					<Skeleton className="w-16 h-4" />
					<Skeleton className="w-16 h-4" />
				</div>
			</div>
		</li>
	);
}
