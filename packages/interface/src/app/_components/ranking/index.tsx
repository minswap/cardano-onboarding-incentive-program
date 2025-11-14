"use client";

import { RiArrowDownLine, RiLoader4Line } from "@remixicon/react";
import * as React from "react";
import type { FilterType } from "@/api/getLeaderboardRank";
import { useRankByAddress } from "@/api/hooks/useRankByAddress";
import { TabSwitcher } from "@/components/tab-switcher";
import { Button } from "@/components/ui/button";
import { wait } from "@/utils/timer";
import { EventStatus } from "../common";
import { RankingList } from "./ranking-list";
import { RankingListSkeleton } from "./skeleton";

const RANKING_TABS = [
	{ label: "All", value: "all" },
	{ label: "No flagged wallets", value: "human" },
	{ label: "Flagged wallets", value: "bot" },
] as const;

export type TabValue = (typeof RANKING_TABS)[number]["value"];

const SCAN_INTERVAL_MS = 200; // time gap between scan attempts
const MAX_SCAN_ATTEMPTS = 30; // number of scan attempts before giving up

export function Ranking({ address, status }: { address: string; status: EventStatus }) {
	const [tab, setTab] = React.useState<TabValue>("all");
	const [isExpanded, setIsExpanded] = React.useState(false);
	const [isScrolling, setIsScrolling] = React.useState(false);

	const { data } = useRankByAddress({ address });
	const userRank = data?.entry ?? null;
	const userTradedTokenDetail = data?.tokenDetail ?? null;

	const handleTabChange = (value: string) => {
		setTab(value as TabValue);
	};

	const handleScrollToUserRank = React.useCallback(async () => {
		if (!userRank) {
			return;
		}
		try {
			setIsScrolling(true);
			const isMatchFilter =
				tab === "all" ||
				(tab === "bot" && userRank.botConfidenceLevel !== 0) ||
				(tab === "human" && userRank.botConfidenceLevel === 0);
			if (!isMatchFilter) {
				setTab("all");
			}
			for (let i = 0; i < MAX_SCAN_ATTEMPTS; i++) {
				await wait(SCAN_INTERVAL_MS);
				const listEl = document.getElementById("ranking-list");
				if (!listEl) {
					continue;
				}
				const dataFilter = listEl.dataset.filter;
				if (
					!dataFilter ||
					(dataFilter === "human" && userRank.botConfidenceLevel > 0) ||
					(dataFilter === "bot" && userRank.botConfidenceLevel === 0)
				) {
					continue;
				}
				const userRow = document.getElementById(userRank.addressIdent);
				const canScroll = Boolean(userRow && listEl.lastChild !== userRow);
				if (canScroll) {
					scrollToId(userRank.addressIdent);
					break;
				}
				const dataExpanded = listEl.dataset.expanded;
				if (dataExpanded === "false") {
					setIsExpanded(true);
					continue;
				}
				scrollToId(userRank.addressIdent);
				break;
			}
		} finally {
			setIsScrolling(false);
		}
	}, [tab, userRank]);

	return (
		<div className="flex flex-col gap-6">
			<div className="sticky top-0 z-20 bg-base-bg">
				<Title
					isScrolling={isScrolling}
					onClick={handleScrollToUserRank}
					rank={userRank?.rank}
				/>
			</div>
			<div className="space-y-8">
				{status < EventStatus.SUPPORT_ENDED && (
					<TabSwitcher
						onValueChange={handleTabChange}
						value={tab}
						values={RANKING_TABS}
					/>
				)}
				<React.Suspense fallback={<RankingListSkeleton />}>
					<RankingList
						filter={tab === "all" ? null : (tab as FilterType)}
						isExpanded={isExpanded}
						setIsExpanded={setIsExpanded}
						status={status}
						userRank={userRank}
						userTradedTokenDetail={userTradedTokenDetail}
					/>
				</React.Suspense>
			</div>
		</div>
	);
}

function Title({
	isScrolling,
	rank,
	onClick,
}: {
	rank?: number;
	isScrolling: boolean;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
	const isEnabled = typeof rank === "number" && rank >= 0;

	return (
		<div className="flex items-center justify-between overflow-auto -mx-4 px-4 bg-base-bg">
			<h2 className="text-title-h5 text-itr-tent-pri-df flex py-2 h-12">Rankings</h2>
			<Button
				className="text-label-sm-sec"
				disabled={!isEnabled}
				iconRight={isScrolling ? <RiLoader4Line className="animate-spin" /> : <RiArrowDownLine />}
				onClick={onClick}
				variant="secondary"
			>
				My rank: {isEnabled ? `#${rank}` : "--"}
			</Button>
		</div>
	);
}

function scrollToId(id: string) {
	const element = document.getElementById(id);
	element?.scrollIntoView({
		behavior: "smooth",
		block: "center",
	});
}
