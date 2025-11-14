import {
	RiArrowDownSFill,
	RiArrowRightSLine,
	RiArrowUpSFill,
	RiCheckFill,
	RiFileCopyFill,
	RiVerifiedBadgeFill,
} from "@remixicon/react";
import Link from "next/link";
import * as React from "react";
import type { TokenDetail } from "@/api/getRankByAddress";
import { useCopyToClipboard } from "@/api/hooks/useCopyToClipboard";
import { CONFIG } from "@/constants/config";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/utils/address";
import { getDefaultTicker, toAssetString } from "@/utils/asset";
import { formatNumber } from "@/utils/number";
import { getPriceChangeClass, getPriceChangeDirection, getPriceChangeText } from "@/utils/price";
import { Divider } from "./divider";
import { IconButton } from "./icon-button";
import { Tooltip } from "./tooltip";

export function AssetInfoTooltip({
	children,
	details,
	token,
}: {
	children?: React.ReactNode;
	details: TokenDetail;
	token: {
		currencySymbol: string;
		tokenName: string;
	};
}) {
	const address = toAssetString(token.currencySymbol, token.tokenName);

	const { isCopied, copyToClipboard } = useCopyToClipboard();

	const { marketCap, volume24h, price, priceChangeText, priceChangeDirection, priceChangeClass } = React.useMemo(() => {
		if (!details?.marketDetails) {
			return {};
		}

		return {
			marketCap:
				formatNumber(details.marketDetails.marketCap, {
					notation: "compact",
				}) ?? "--",

			volume24h:
				formatNumber(details.marketDetails.volume24h, {
					notation: "compact",
				}) ?? "--",

			price:
				formatNumber(details.marketDetails.price, {
					notation: "compact",
				}) ?? "--",

			priceChangeClass: getPriceChangeClass(details.marketDetails.priceChange24h),
			priceChangeText: getPriceChangeText(details.marketDetails.priceChange24h) ?? "--",
			priceChangeDirection: getPriceChangeDirection(details.marketDetails.priceChange24h),
		};
	}, [details.marketDetails]);

	return (
		<Tooltip
			asChild
			cls={{
				content: "bg-base-bg shadow-2xl rounded-[20px] border border-bd-pri-sub p-5 w-full",
			}}
			content={
				<div className="space-y-2">
					<div className="flex items-center justify-between space-x-4">
						<div>
							<div className="flex items-center space-x-1 justify-start">
								<p className="text-label-lg-pri text-itr-tent-pri-df">
									{details.metadata?.name ?? getDefaultTicker(token.tokenName) ?? "--"}
								</p>
								{details.metadata.isVerified && <RiVerifiedBadgeFill className="size-4 text-itr-tone-hl" />}
							</div>
							<button
								className={cn(
									"inline-flex cursor-pointer items-center gap-x-2 text-p-xs focus:outline-none",
									isCopied ? "text-base-sc" : "text-itr-tent-pri-sub",
								)}
								onClick={(e) => {
									e.stopPropagation();
									copyToClipboard(token.currencySymbol);
								}}
								type="button"
							>
								<span>Policy ID: {shortenAddress(token.currencySymbol)}</span>
								{isCopied ? (
									<RiCheckFill className="size-4 shrink-0" />
								) : (
									<RiFileCopyFill className="size-4 shrink-0" />
								)}
							</button>
						</div>

						<Link
							href={`${CONFIG.NEXT_PUBLIC_MINSWAP_URL}/tokens/${address}`}
							target="_parent"
						>
							<IconButton icon={<RiArrowRightSLine />} />
						</Link>
					</div>
					<Divider />
					<div className="space-y-1.5">
						<div className="flex items-center justify-between space-x-4">
							<div className="text-p-xs text-itr-tent-pri-sub">Market cap</div>
							<div className="text-label-sm-sec text-right text-itr-tent-pri-df">{marketCap} ₳</div>
						</div>
						<div className="flex items-center justify-between space-x-4">
							<div className="text-p-xs text-itr-tent-pri-sub">Vol (24h)</div>
							<div className="text-label-sm-sec text-right text-itr-tent-pri-df">{volume24h} ₳</div>
						</div>
						<div className="flex items-center justify-between space-x-4">
							<div className="text-p-xs text-itr-tent-pri-sub">Price</div>
							<div
								className={cn(
									"text-label-sm-sec text-right flex flex-wrap items-center justify-end gap-1 text-itr-tent-pri-df",
								)}
							>
								{!!priceChangeText && (priceChangeDirection?.isIncreasing || priceChangeDirection?.isDecreasing) && (
									<div className={cn("flex items-center justify-end text-label-sm-sec", priceChangeClass)}>
										<div>{priceChangeText}</div>
										{priceChangeDirection.isIncreasing ? <RiArrowUpSFill className="size-4 shrink-0" /> : null}
										{priceChangeDirection.isDecreasing ? <RiArrowDownSFill className="size-4 shrink-0" /> : null}
									</div>
								)}
								<div className="whitespace-nowrap">{price} ₳</div>
							</div>
						</div>
					</div>
				</div>
			}
		>
			{children}
		</Tooltip>
	);
}
