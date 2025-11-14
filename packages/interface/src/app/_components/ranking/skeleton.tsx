import { HorizontalRankListSkeleton } from "./horizontal-list/skeleton";
import { RankTableSkeleton } from "./table/skeleton";

export function RankingListSkeleton() {
	return (
		<div className="space-y-6 lg:space-y-8">
			<div className="lg:max-w-[calc(100vw-4rem)] max-w-[calc(100vw-2rem)]">
				<HorizontalRankListSkeleton />
			</div>
			<RankTableSkeleton />
		</div>
	);
}
