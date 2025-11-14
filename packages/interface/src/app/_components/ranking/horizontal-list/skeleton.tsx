import { RankerCardSkeleton } from "./card/skeleton";

export function HorizontalRankListSkeleton() {
	return (
		<div className="flex gap-4 overflow-x-hidden">
			{Array.from({ length: 3 }).map((_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Using index as key for skeletons is acceptable
				<RankerCardSkeleton key={index} />
			))}
		</div>
	);
}
