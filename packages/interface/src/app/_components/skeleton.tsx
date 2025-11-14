"use client";
import { Separator } from "@/components/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RankingListSkeleton } from "./ranking/skeleton";

export function LeaderboardSkeleton() {
	return (
		<div className="bg-base-bg px-4 lg:px-6 py-6 lg:py-8">
			<div className="space-y-4 lg:space-y-5 mx-auto max-w-screen-xl">
				<TitleSkeleton />
				<BannerSkeleton />
				<RankingSkeleton />
			</div>
		</div>
	);
}

function TitleSkeleton() {
	return (
		<div className="flex lg:flex-row flex-col justify-center lg:justify-end items-center gap-2">
			<Skeleton className="w-full lg:w-[150px] h-9" />
			<div className="flex justify-end gap-2 w-full lg:w-fit">
				<Skeleton className="flex-1 lg:flex-none lg:w-[146px] h-9" />
				<Skeleton className="flex-1 lg:flex-none lg:w-[102px] h-9" />
			</div>
		</div>
	);
}

function BannerSkeleton() {
	return (
		<div className="border border-bd-pri-df rounded-[20px]">
			<div className="flex lg:flex-row flex-col justify-between items-center gap-y-5 lg:py-8 pt-8 lg:pl-8 max-w-screen lg:h-[360px]">
				<div className="flex flex-col justify-between gap-6 px-6 lg:px-0 w-full h-full">
					<div className="flex flex-col items-start gap-2">
						<div className="flex items-center gap-1 text-itr-tent-pri-sub text-p-sm">
							Prize pool
							<Skeleton className="size-4" />
						</div>
						<Skeleton className="w-60 h-[56px]" />
					</div>
					<div className="flex flex-col items-center lg:items-start gap-4 xl:gap-6 w-full">
						<div className="flex lg:flex-row flex-col justify-between lg:justify-start items-center lg:items-start gap-4 xl:gap-6 w-full">
							<ItemSkeleton
								cls={{ item: "w-14" }}
								title="Participants"
							/>
							<ItemSkeleton title="Total Trading Volume" />
							<ItemSkeleton title="Total Points Generated" />
						</div>
						<div className="flex flex-row md:flex-col justify-between items-center lg:items-start gap-2 pb-6 lg:pb-0 w-full">
							<div className="text-itr-tent-pri-sub text-p-sm">Event ends in</div>
							<div className="flex justify-center lg:justify-start items-center gap-2 [&>*]:rounded-2xl">
								<Skeleton className="w-10 h-6" />
								<Separator />
								<Skeleton className="w-10 h-6" />
								<Separator />
								<Skeleton className="w-10 h-6" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function ItemSkeleton({ title, cls }: { title: string; cls?: { item: string } }) {
	return (
		<div className="flex flex-row lg:flex-col justify-between items-center lg:items-start gap-2 w-full lg:w-fit">
			<span className="text-itr-tent-pri-sub text-p-sm line-clamp-1">{title}</span>
			<Skeleton className={cn("w-32 h-6", cls?.item)} />
		</div>
	);
}

export function RankingSkeleton() {
	return (
		<div className="flex flex-col gap-6 lg:gap-8 w-full">
			<div className="space-y-6">
				<div className="flex py-2 h-9 text-itr-tent-pri-df text-title-h5">Rankings</div>
				<Skeleton className="bg-sf-pri-df w-full lg:w-[386px] h-9" />
			</div>
			<RankingListSkeleton />
		</div>
	);
}
