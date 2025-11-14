import Image from "next/image";
import type React from "react";
import type { TokenDetail } from "@/api/getRankByAddress";
import diamondIcon from "@/app/_assets/images/diamond.webp";
import { BotFlagBadge } from "@/components/bot-flag-badge";
import { LinkButton } from "@/components/link-buton";
import { Tooltip } from "@/components/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/utils/address";
import { getExplorerLinkForAddress, type SupportedExplorer } from "@/utils/explorer";
import { formatNumber } from "@/utils/number";
import { getRandomAvatar } from "../../../../_helpers/randomAvatar";
import { OverlappingIcons } from "../../../overlapping-icons";
import { rankToBadgeType } from "./common";

type Props = {
	address: string;
	rank: number;
	point: number;
	estimatedReward: number;
	mostTradedTokens: { currencySymbol: string; tokenName: string }[];
	explorer: SupportedExplorer;
	tokenDetail: Record<string, TokenDetail>;
	flags: number;
	isSelected?: boolean;
	showBadgeFrame: boolean;
	showBotFlag: boolean;
};

export function RankerCard({
	address,
	rank,
	point,
	estimatedReward,
	mostTradedTokens,
	explorer,
	tokenDetail,
	flags,
	isSelected,
	showBadgeFrame,
	showBotFlag,
}: Props) {
	const type = rankToBadgeType(rank);
	const avatar = getRandomAvatar(address);

	return (
		<li
			className={cn(
				"p-6 min-h-48 min-w-80 bg-base-bg border rounded-[20px] flex flex-col gap-6 flex-1 hover:bg-sf-pri-sub",
				isSelected ? "border-bd-pri-hv" : "border-bd-pri-sub",
			)}
			id={address}
		>
			<div className="flex justify-between">
				<div className="flex flex-col gap-2">
					<Image
						alt="avatar"
						className="size-11"
						onDragStart={(e) => e.preventDefault()}
						src={avatar}
					/>
					<div className="flex items-center gap-2">
						<Tooltip content={address}>
							<LinkButton
								className="text-itr-tent-pri-df text-label-md-sec"
								href={getExplorerLinkForAddress(explorer, address)}
								showIcon
							>
								{shortenAddress(address)}
							</LinkButton>
						</Tooltip>
						{showBotFlag && flags ? <BotFlagBadge flags={flags} /> : null}
					</div>
				</div>
				<Badge
					content={`#${rank}`}
					hasFrame={showBadgeFrame}
					type={type}
				/>
			</div>
			<div className="flex justify-between">
				<Item title="Points">
					<span className="text-itr-tent-pri-df text-label-md-sec">{formatNumber(point)}</span>
					<Image
						alt="Diamond icon"
						height={14}
						src={diamondIcon}
						width={14}
					/>
				</Item>
				<Item
					className="items-end"
					title="Most traded"
				>
					<OverlappingIcons
						mostTradedTokens={mostTradedTokens}
						tokenDetail={tokenDetail}
					/>
				</Item>
				<Item
					className="items-end"
					title="Est. reward"
				>
					<span className="text-itr-tent-pri-df text-label-md-sec">{formatNumber(estimatedReward)} ₳</span>
				</Item>
			</div>
		</li>
	);
}

export function Item({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
	return (
		<div className={cn("flex flex-col gap-1", className)}>
			<span className="text-itr-tent-pri-sub text-p-xs">{title}</span>
			<div className="gap-x-2 flex items-center">{children}</div>
		</div>
	);
}
