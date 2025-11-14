import { RiArrowDownLine, RiArrowUpLine, RiLoader4Line } from "@remixicon/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import type { FilterType } from "@/api/getLeaderboardRank";
import type { RankEntry, TokenDetail } from "@/api/getRankByAddress";
import { useMediaQueryWithBreakpoint } from "@/api/hooks/useMediaQueryWithBreakpoint";
import diamondIcon from "@/app/_assets/images/diamond.webp";
import { getRandomAvatar } from "@/app/_helpers/randomAvatar";
import { BotFlagBadge } from "@/components/bot-flag-badge";
import { Divider } from "@/components/divider";
import { LinkButton } from "@/components/link-buton";
import { Tooltip } from "@/components/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/utils/address";
import { getExplorerLinkForAddress, type SupportedExplorer } from "@/utils/explorer";
import { formatNumber } from "@/utils/number";
import { DEFAULT_EXPLORER } from "../../common";
import { OverlappingIcons } from "../../overlapping-icons";
import { Item } from "../horizontal-list/card";

type ItemListProps = {
	rankEntries: RankEntry[];
	selectedItem: string | null;
	isExpanded: boolean;
	tokenDetail: Record<string, TokenDetail>;
	setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
	showSeeMoreButton: boolean;
	showBotFlag: boolean;
	filter: FilterType | null;
};

export const RankTable = ({
	rankEntries,
	isExpanded,
	setIsExpanded,
	tokenDetail,
	selectedItem,
	showSeeMoreButton,
	showBotFlag,
	filter,
}: ItemListProps) => {
	const params = useSearchParams();
	const explorer = (params.get("explorer") as SupportedExplorer) ?? DEFAULT_EXPLORER;
	const isMobile = useMediaQueryWithBreakpoint("mobile");
	const [isPending, startTransition] = React.useTransition();

	function handleSeeMore() {
		startTransition(() => {
			setIsExpanded((prev) => !prev);
		});
	}

	return (
		<div className="space-y-0.5 pb-16 md:pb-0">
			<div className="bg-base-bg sticky top-12 z-10">
				<div className="hidden grid-cols-[96px_1fr_1fr_1fr_1fr] lg:grid rounded-lg bg-sf-pri-sub text-label-sm-sec text-itr-tent-pri-sub [&>div]:px-4 [&>div]:py-3">
					<div>Place</div>
					<div>Wallet</div>
					<div className="ml-auto">Points</div>
					<div className="ml-auto">Most traded</div>
					<div className="ml-auto">Est. reward</div>
				</div>
			</div>
			<ul
				data-expanded={showSeeMoreButton ? isExpanded : undefined}
				data-filter={filter ?? "all"}
				id="ranking-list"
			>
				{rankEntries.map((account, index) => (
					<li
						id={account.addressIdent}
						key={account.addressIdent}
					>
						<RankTableRow
							account={account}
							explorer={explorer}
							flags={account.botConfidenceLevel}
							isMobile={isMobile}
							isSelected={selectedItem === account.addressIdent}
							key={account.addressIdent}
							showBotFlag={showBotFlag}
							tokenDetail={tokenDetail}
						/>
						{index + 1 !== rankEntries.length ? (
							<Divider className="w-[calc(100%-2rem)] -mb-[1px] mx-auto bg-bd-pri-ter lg:hidden block" />
						) : null}
					</li>
				))}
			</ul>
			{showSeeMoreButton ? (
				<Button
					className="w-full"
					iconRight={
						isPending ? (
							<RiLoader4Line
								className="animate-spin"
								size={16}
							/>
						) : isExpanded ? (
							<RiArrowUpLine size={16} />
						) : (
							<RiArrowDownLine size={16} />
						)
					}
					onClick={handleSeeMore}
					variant="secondary"
				>
					{isExpanded ? "View less" : "View all"}
				</Button>
			) : null}
		</div>
	);
};

function RankTableRow({
	account,
	isSelected,
	explorer,
	tokenDetail,
	flags,
	isMobile,
	showBotFlag,
}: {
	account: RankEntry;
	isSelected?: boolean;
	explorer: SupportedExplorer;
	tokenDetail: Record<string, TokenDetail>;
	flags: number;
	isMobile: boolean;
	showBotFlag: boolean;
}) {
	const botFragBadge = React.useMemo(() => {
		if (!showBotFlag || !flags) {
			return null;
		}
		return <BotFlagBadge flags={flags} />;
	}, [flags, showBotFlag]);

	if (isMobile) {
		return (
			<div
				className={cn(
					"px-2 py-3 rounded-2xl flex flex-col gap-3",
					"transition-all duration-300",
					isSelected ? "border-bd-pri-pressed border" : "",
				)}
			>
				<div className="flex items-center">
					<div className="w-8 text-itr-tent-pri-df break-words">{account.rank}</div>
					<div className="flex-1 flex gap-2 items-center">
						<Image
							alt="avatar"
							className="size-7"
							src={getRandomAvatar(account.addressIdent)}
						/>
						<div className="flex items-center gap-1 lg:gap-2">
							<Tooltip content={account.addressIdent}>
								<LinkButton
									className="text-itr-tent-pri-df text-label-sm-sec"
									href={getExplorerLinkForAddress(explorer, account.addressIdent)}
									showIcon
								>
									{shortenAddress(account.addressIdent)}
								</LinkButton>
							</Tooltip>
							{botFragBadge}
						</div>
					</div>
					<Item
						className="flex-1 items-end"
						title="Points"
					>
						<span className="text-itr-tent-pri-df text-label-sm-sec">{formatNumber(account.point)}</span>
						<Image
							alt="Diamond icon"
							height={16}
							src={diamondIcon}
							width={16}
						/>
					</Item>
				</div>
				<div className="flex items-center">
					<div className="w-8" />
					<Item
						className="flex-1"
						title="Most traded"
					>
						<OverlappingIcons
							mostTradedTokens={account.mostTradedTokens}
							tokenDetail={tokenDetail}
						/>
					</Item>
					<Item
						className="flex-1 items-end"
						title="Est. reward"
					>
						<span className="text-itr-tent-pri-df text-label-sm-sec">{formatNumber(account.reward)} ₳</span>
					</Item>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"grid grid-cols-[96px_1fr_1fr_1fr_1fr] z-50 items-center rounded-2xl text-label-sm-sec text-itr-tent-pri-df [&>div]:px-4 [&>div]:py-3 h-[60px] hover:bg-sf-pri-sub",
				isSelected ? "border border-bd-pri-pressed" : "",
			)}
		>
			<div>#{account.rank}</div>
			<div className="flex items-center gap-3">
				<Image
					alt="avatar"
					className="size-7"
					src={getRandomAvatar(account.addressIdent)}
				/>
				<div className="flex items-center lg:gap-2 gap-1">
					<Tooltip content={account.addressIdent}>
						<LinkButton
							className="p-0"
							href={getExplorerLinkForAddress(explorer, account.addressIdent)}
							showIcon
						>
							{shortenAddress(account.addressIdent)}
						</LinkButton>
					</Tooltip>

					{botFragBadge}
				</div>
			</div>
			<div className="flex items-center gap-2 justify-end">
				{formatNumber(account.point)}
				<Image
					alt="Diamond icon"
					height={16}
					src={diamondIcon}
					width={16}
				/>
			</div>
			<div className="ml-auto">
				<OverlappingIcons
					mostTradedTokens={account.mostTradedTokens}
					tokenDetail={tokenDetail}
				/>
			</div>
			<div className="ml-auto">{formatNumber(account.reward)} ₳</div>
		</div>
	);
}
