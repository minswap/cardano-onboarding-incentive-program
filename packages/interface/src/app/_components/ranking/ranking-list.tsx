import * as React from "react";
import type { FilterType } from "@/api/getLeaderboardRank";
import type { RankEntry, TokenDetail } from "@/api/getRankByAddress";
import { useLeaderboardRank } from "@/api/hooks/useLeaderboardRank";
import { EventStatus, SUPPORT_ENDED_MAX_RANKS, TOP_3, TOP_RANKS } from "../common";
import { EmptyLeaderboard } from "../empty";
import { HorizontalRankList } from "./horizontal-list";
import { RankTable } from "./table";

export function RankingList({
	filter,
	userRank,
	userTradedTokenDetail,
	isExpanded,
	status,
	setIsExpanded,
}: {
	filter: FilterType | null;
	userRank: RankEntry | null;
	userTradedTokenDetail: Record<string, TokenDetail> | null;
	isExpanded: boolean;
	status: EventStatus;
	setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const isSupportEnded = status === EventStatus.SUPPORT_ENDED;
	const isBoostingSeason = status === EventStatus.BOOSTING_SEASON;

	const {
		data: { entries: leaderboard, tokenDetail: leaderboardTokenDetail },
	} = useLeaderboardRank({ filter, limit: isSupportEnded ? SUPPORT_ENDED_MAX_RANKS : undefined });

	const tokenDetail = React.useMemo(() => {
		return {
			...leaderboardTokenDetail,
			...(userTradedTokenDetail ?? {}),
		};
	}, [leaderboardTokenDetail, userTradedTokenDetail]);

	const mergedLeaderboard = React.useMemo(() => {
		if (!leaderboard) {
			return [];
		}
		if (!userRank || userRank.rank < 0) {
			return leaderboard;
		}
		const inLeaderboard = leaderboard.some((entry) => entry.addressIdent === userRank.addressIdent);
		if (inLeaderboard) {
			return leaderboard;
		}
		const shouldAppendUserRank =
			!filter ||
			(filter === "bot" && userRank.botConfidenceLevel > 0) ||
			(filter === "human" && userRank.botConfidenceLevel === 0);
		if (shouldAppendUserRank) {
			return [...leaderboard, userRank];
		}
		return leaderboard;
	}, [leaderboard, userRank, filter]);

	const displayLeaderboard = React.useMemo(() => {
		if (isExpanded || isSupportEnded) {
			return mergedLeaderboard;
		}
		const topRanks = mergedLeaderboard.slice(0, TOP_RANKS);
		const shouldAppendUserRank = Boolean(
			userRank &&
				userRank.rank >= 0 &&
				(!filter ||
					(filter === "bot" && userRank.botConfidenceLevel > 0) ||
					(filter === "human" && userRank.botConfidenceLevel === 0)) &&
				!topRanks.some((entry) => entry.addressIdent === userRank.addressIdent),
		);
		if (shouldAppendUserRank) {
			return [...topRanks, userRank as RankEntry];
		}
		return topRanks;
	}, [isExpanded, mergedLeaderboard, userRank, filter, isSupportEnded]);

	const isExpandable = mergedLeaderboard.length > TOP_RANKS;

	const displayState = {
		showSeeMoreButton: !isSupportEnded && isExpandable,
		showHorizontalLeaderboard: mergedLeaderboard.length > 2,
		showBotFlag: !isSupportEnded,
		showBadgeFrame: isBoostingSeason,
	};

	if (mergedLeaderboard.length === 0) {
		return <EmptyLeaderboard />;
	}

	return (
		<>
			{displayState.showHorizontalLeaderboard ? (
				<HorizontalRankList
					rankEntries={displayLeaderboard.slice(0, TOP_3)}
					selectedItem={userRank?.addressIdent ?? null}
					showBadgeFrame={displayState.showBadgeFrame}
					showBotFlag={displayState.showBotFlag}
					tokenDetail={tokenDetail}
				/>
			) : null}
			<RankTable
				filter={filter}
				isExpanded={isExpanded}
				rankEntries={displayState.showHorizontalLeaderboard ? displayLeaderboard.slice(TOP_3) : displayLeaderboard}
				selectedItem={userRank?.addressIdent ?? null}
				setIsExpanded={setIsExpanded}
				showBotFlag={displayState.showBotFlag}
				showSeeMoreButton={displayState.showSeeMoreButton}
				tokenDetail={tokenDetail}
			/>
		</>
	);
}
