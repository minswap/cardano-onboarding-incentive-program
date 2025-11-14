import { useSearchParams } from "next/navigation";
import type { RankEntry, TokenDetail } from "@/api/getRankByAddress";
import type { SupportedExplorer } from "@/utils/explorer";
import { DEFAULT_EXPLORER } from "../../common";
import { RankerCard } from "./card";

export type ItemListProps = {
	rankEntries: RankEntry[];
	selectedItem: string | null;
	tokenDetail: Record<string, TokenDetail>;
	showBotFlag: boolean;
	showBadgeFrame: boolean;
};

export function HorizontalRankList({
	rankEntries,
	selectedItem,
	tokenDetail,
	showBadgeFrame,
	showBotFlag,
}: ItemListProps) {
	const params = useSearchParams();
	const explorer = (params.get("explorer") as SupportedExplorer) ?? DEFAULT_EXPLORER;

	return (
		<ul className="flex items-center gap-4 no-scrollbar overflow-x-auto -mx-4 px-4">
			{rankEntries.map((account) => (
				<RankerCard
					address={account.addressIdent}
					estimatedReward={account.reward}
					explorer={explorer}
					flags={account.botConfidenceLevel}
					isSelected={selectedItem === account.addressIdent}
					key={account.addressIdent}
					mostTradedTokens={account.mostTradedTokens}
					point={account.point}
					rank={account.rank}
					showBadgeFrame={showBadgeFrame}
					showBotFlag={showBotFlag}
					tokenDetail={tokenDetail}
				/>
			))}
		</ul>
	);
}
