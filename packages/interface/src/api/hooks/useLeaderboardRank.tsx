import { useSuspenseQuery } from "@tanstack/react-query";
import {
	getLeaderboardRank,
	type LeaderboardRankEntryRequest,
	parseLeaderboardRankResponse,
} from "../getLeaderboardRank";

export function useLeaderboardRank({ filter, limit }: LeaderboardRankEntryRequest) {
	return useSuspenseQuery({
		queryKey: ["leaderboard-rank", filter, limit],
		queryFn: () => getLeaderboardRank({ filter, limit }),
		select: parseLeaderboardRankResponse,
		refetchInterval: 60_000,
	});
}
