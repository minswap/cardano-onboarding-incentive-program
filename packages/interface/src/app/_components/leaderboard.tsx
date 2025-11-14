"use client";

import { RiCopperCoinFill, RiExternalLinkLine, RiQuestionMark, RiVerifiedBadgeFill } from "@remixicon/react";
import Link from "next/link";
import * as React from "react";
import { useEventStat } from "@/api/hooks/useEventStat";
import { useServerTime } from "@/api/hooks/useServerTime";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssetLogo } from "./asset-logo";
import { Banner } from "./banner";
import { ComingSoonBanner } from "./coming-soon/coming-soon-banner";
import { ComingSoonCarousel } from "./coming-soon/coming-soon-carousel";
import { EventStatus, getEventStatus, TOKEN_MULTIPLIERS } from "./common";
import { Confetti } from "./confetti";
import { Ranking } from "./ranking";
import { ResultAlert } from "./result-alert";
import { ResultPendingAlert } from "./result-pending-alert";
import { RankingSkeleton } from "./skeleton";

type Props = {
	address?: string;
	localTz?: boolean;
};

const A_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function Leaderboard({ address, localTz }: Props) {
	const { data: eventStat } = useEventStat();
	const serverTime = useServerTime();

	const contactEnd = eventStat.endDate + A_WEEK_MS;
	const status = getEventStatus(
		serverTime,
		eventStat.startDate,
		eventStat.startOfBoostingWeek,
		eventStat.endDate,
		contactEnd,
	);

	return (
		<>
			{status === EventStatus.SUPPORT_ENDED && <Confetti />}
			<div className="px-4 py-6 lg:px-6 lg:py-8">
				<div className="mx-auto space-y-4 lg:space-y-5 max-w-screen-xl">
					{status <= EventStatus.COMING_SOON && (
						<>
							<ComingSoonCarousel />
							<ComingSoonBanner
								endTime={eventStat.startDate}
								startTime={serverTime}
							/>
						</>
					)}
					{status > EventStatus.COMING_SOON && (
						<>
							<Header />
							<Banner
								eventStat={eventStat}
								eventStatus={status}
								serverTime={serverTime}
							/>
							{status === EventStatus.ENDED && (
								<ResultPendingAlert
									expiredContactTime={contactEnd}
									localTz={localTz}
								/>
							)}
							{status === EventStatus.SUPPORT_ENDED && <ResultAlert />}
							<React.Suspense fallback={<RankingSkeleton />}>
								<Ranking
									address={address ?? ""}
									status={status}
								/>
							</React.Suspense>
						</>
					)}
				</div>
			</div>
		</>
	);
}

function Header() {
	const [openModal, setOpenModal] = React.useState(false);

	return (
		<div className="md:flex md:items-center md:justify-end md:space-x-2">
			<Button
				className="w-full flex md:inline-flex md:w-auto"
				iconRight={<RiQuestionMark />}
				onClick={() => setOpenModal(true)}
			>
				Point system
			</Button>
			<div className="flex items-center justify-between space-x-2 md:block mt-2 md:mt-0">
				<Link
					className="flex-1"
					href={"https://discord.gg/minswap"}
					target="_blank"
				>
					<Button
						className="w-full md:w-auto"
						iconRight={<RiExternalLinkLine />}
						variant="sub"
					>
						I'm not a bot
					</Button>
				</Link>
				<Link
					className="flex-1"
					href="https://x.com/MinswapDEX/status/1965054368836702616"
					target="_blank"
				>
					<Button
						className="w-full md:w-auto"
						iconRight={<RiExternalLinkLine />}
						variant="sub"
					>
						Rules
					</Button>
				</Link>
			</div>
			<Dialog
				onClose={() => setOpenModal(false)}
				open={openModal}
				title="Point system"
			>
				<div className="mt-2 overflow-auto max-h-[385px] relative">
					<div className="z-10 bg-base-bg sticky top-0">
						<div className="flex items-center justify-between px-4 py-3 rounded-lg bg-sf-pri-sub text-label-sm-sec text-itr-tent-pri-sub">
							<span>Token</span>
							<span>Multiplier</span>
						</div>
					</div>
					{TOKEN_MULTIPLIERS.map((token) => {
						return (
							<div
								className="flex items-center justify-between space-x-2 px-4 py-3"
								key={token.currencySymbol + token.tokenName}
							>
								{token.currencySymbol === "" ? (
									<div className="inline-flex size-7 bg-sf-pri-df shrink-0 relative items-center justify-center rounded-full">
										<RiCopperCoinFill className="size-5 shrink-0 text-itr-tone-sub" />
										<div className="absolute -bottom-1 -right-1 border size-4 border-sf-pri-sub rounded-full bg-base-bg flex items-center justify-center">
											<RiVerifiedBadgeFill className="size-3 shrink-0 text-itr-tone-hl" />
										</div>
									</div>
								) : (
									<AssetLogo
										currencySymbol={token.currencySymbol}
										isVerified
										tokenName={token.tokenName}
									/>
								)}
								<div className="flex-1 text-label-sm-sec text-itr-tent-pri-df">{token.ticker}</div>
								<div
									className={cn("px-3 py-1 rounded-full text-label-xs-sec text-brand-deep", {
										"bg-brand-river": token.multiplier === 5,
										"bg-dec-yellow-df": token.multiplier === 2,
										"bg-dec-rose-df": token.multiplier === 1,
									})}
								>
									{token.multiplier}x points
								</div>
							</div>
						);
					})}
				</div>
			</Dialog>
		</div>
	);
}
