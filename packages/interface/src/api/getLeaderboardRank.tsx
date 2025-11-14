import { fetchApi } from "@/lib/fetch-api";
import type { RankEntry, TokenDetail } from "./getRankByAddress";

export type FilterType = "human" | "bot";

export type LeaderboardRankEntryRequest = {
	filter: FilterType | null;
	limit?: number;
};

type LeaderboardRankEntryResponse = {
	data: {
		entries: RankEntry[];
		tokenDetail: Record<string, TokenDetail>;
	};
};

export function parseLeaderboardRankResponse(
	response: LeaderboardRankEntryResponse,
): LeaderboardRankEntryResponse["data"] {
	return response.data;
}

export function getLeaderboardRank({
	filter,
	limit: _limit,
}: LeaderboardRankEntryRequest): Promise<LeaderboardRankEntryResponse> {
	const limit = _limit ?? (filter ? 100 : 200); // If limit param not provided, adjust limit based on filter
	return fetchApi(`rank?limit=${limit}&filter=${filter ?? ""}`).json();
}
