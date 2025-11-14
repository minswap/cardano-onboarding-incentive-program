"use client";

import { RiInformationFill } from "@remixicon/react";
import Image from "next/image";
import type * as React from "react";
import type { EventStat } from "@/api/getEventStat";
import diamondIcon from "@/app/_assets/images/diamond.webp";
import { Tooltip } from "@/components/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/number";
import { EventStatus } from "./common";
import { CountdownTimer } from "./count-down-timer";

type Props = {
	serverTime: number;
	eventStat: EventStat;
	eventStatus: EventStatus;
};

export function Banner({ serverTime, eventStat, eventStatus }: Props) {
	const isComingSoon = eventStatus === EventStatus.COMING_SOON;
	return (
		<div className="relative">
			<div
				className={cn(
					"relative flex max-w-screen flex-col items-center gap-y-6 overflow-hidden rounded-[20px] border pt-8 lg:flex-row lg:items-center lg:justify-between lg:pl-8 lg:pb-8",
					isComingSoon ? "lg:h-[560px] border-bd-pri-sub" : "lg:h-[360px] border-bd-pri-df",
				)}
			>
				<div className="flex h-full w-full flex-col justify-between gap-6 px-6 lg:w-fit lg:px-0">
					<div className={cn("flex flex-col items-start", isComingSoon ? "gap-4" : "gap-2")}>
						<div
							className={cn(
								"text-itr-tent-pri-sub flex items-center gap-1",
								isComingSoon ? "text-label-lg-sec" : "text-p-sm",
							)}
						>
							Prize pool
							<Tooltip
								asChild
								cls={{ content: "text-center" }}
								content={
									<>
										Value of the prize pool to be distributed.
										<br />
										More trades, more rewards.
									</>
								}
							>
								<RiInformationFill size={16} />
							</Tooltip>
						</div>
						<div
							className={cn(
								"text-itr-tent-pri-df line-clamp-1",
								isComingSoon ? "text-title-h1 max-[378px]:text-title-h2" : "text-title-h2",
							)}
						>
							{formatNumber(eventStat.prizePool)} ₳ {isComingSoon ? "+" : ""}
						</div>
					</div>
					<div className="flex flex-col items-center gap-4 lg:gap-6 lg:items-start">
						{eventStatus >= EventStatus.ACTIVE ? (
							<div className="flex flex-col items-start gap-4 lg:flex-row lg:gap-6 w-full">
								<Item title="Participants">{eventStat.totalTraders}</Item>
								<Item title="Total Trading Volume">
									<div>
										{formatNumber(eventStat.totalTradingVolume, {
											notation: "compact",
											maximumFractionDigits: 2,
										})}{" "}
										₳
									</div>
								</Item>
								<Item title="Total Points Generated">
									{formatNumber(eventStat.totalPoints)}
									<Image
										alt="Diamond icon"
										height={16}
										src={diamondIcon}
										width={16}
									/>
								</Item>
							</div>
						) : null}
						{eventStatus >= EventStatus.ENDED ? (
							<Badge
								className="h-[52px] w-full lg:w-fit px-4 py-3 rounded-2xl justify-center"
								cls={{ content: "text-title-h6" }}
								content="Event Ended"
								type="sub"
							/>
						) : (
							<div className="flex flex-col gap-6 w-full">
								<div className="flex flex-row md:flex-col items-center justify-between lg:items-start gap-2">
									<div className="text-p-sm text-itr-tent-pri-sub">Event ends in</div>
									<CountdownTimer
										endTime={eventStat.endDate}
										startTime={serverTime}
									/>
								</div>

								{isComingSoon && (
									<div className="space-y-2 text-itr-tent-pri-sub text-label-lg-sec text-center lg:text-left">
										<div className="block">The race hasn't started, but the prize smells delicious...</div>
										<div className="block">Sit tight - this is gonna get wild.</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
				{eventStatus === EventStatus.BOOSTING_SEASON ? (
					<div className="w-full lg:w-[540px] h-full lg:h-[360px]">
						<video
							autoPlay={true}
							className={cn("hidden dark:block object-cover w-full h-full")}
							loop={true}
							muted={true}
							playsInline={true}
							preload="none"
						>
							<source
								src="/videos/dark-boost-banner.mp4"
								type="video/mp4"
							/>
						</video>
						<video
							autoPlay={true}
							className="block dark:hidden object-cover w-full h-full"
							loop={true}
							muted={true}
							playsInline={true}
							preload="none"
						>
							<source
								src="/videos/light-boost-banner.mp4"
								type="video/mp4"
							/>
						</video>
					</div>
				) : (
					<div
						className={cn(
							"w-full lg:w-[540px] h-full lg:h-[360px]",
							isComingSoon ? "lg:absolute right-0 bottom-0" : "",
						)}
					>
						<video
							autoPlay={true}
							className={cn("hidden dark:block object-cover w-full h-full")}
							loop={true}
							muted={true}
							playsInline={true}
							preload="none"
						>
							<source
								src="/videos/dark-banner.mp4"
								type="video/mp4"
							/>
						</video>
						<video
							autoPlay={true}
							className="block dark:hidden object-cover w-full h-full"
							loop={true}
							muted={true}
							playsInline={true}
							preload="none"
						>
							<source
								src="/videos/light-banner.mp4"
								type="video/mp4"
							/>
						</video>
					</div>
				)}
			</div>

			{eventStatus !== EventStatus.BOOSTING_SEASON && (
				<div className="lg:block hidden">
					<video
						autoPlay={true}
						className={cn(
							"lg:w-[200px] h-[200px] absolute -right-6 block dark:hidden",
							isComingSoon ? "top-0" : "-top-8",
						)}
						loop={true}
						muted={true}
						playsInline={true}
						preload="none"
					>
						<source
							src="/videos/light-rose.mov"
							type="video/quicktime"
						/>
						<source
							src="/videos/light-rose.webm"
							type="video/webm"
						/>
					</video>
					<video
						autoPlay={true}
						className={cn(
							"lg:w-[200px] h-[200px] absolute -right-6 -top-8 dark:block hidden",
							isComingSoon ? "top-0" : "-top-8",
						)}
						loop={true}
						muted={true}
						playsInline={true}
						preload="none"
					>
						<source
							src="/videos/dark-rose.mov"
							type="video/quicktime"
						/>
						<source
							src="/videos/dark-rose.webm"
							type="video/webm"
						/>
					</video>
				</div>
			)}
		</div>
	);
}

function Item({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				"w-full flex flex-row items-center justify-between gap-2 lg:flex-col lg:items-start lg:w-fit",
				className,
			)}
		>
			<span className="text-itr-tent-pri-sub text-p-sm line-clamp-1">{title}</span>
			<div className="gap-x-1 flex items-center text-label-lg-sec text-itr-tent-pri-df">{children}</div>
		</div>
	);
}
