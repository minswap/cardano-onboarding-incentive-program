import Image from "next/image";
import type { TokenDetail } from "@/api/getRankByAddress";
import { AssetInfoTooltip } from "@/components/asset-info-tooltip";
import { cn } from "@/lib/utils";
import { toAssetString } from "@/utils/asset";
import { getLogoSrc } from "./ranking/common";

export function OverlappingIcons({
	mostTradedTokens,
	tokenDetail,
}: {
	tokenDetail: Record<string, TokenDetail>;
	mostTradedTokens: {
		currencySymbol: string;
		tokenName: string;
	}[];
}) {
	return (
		<div className="flex items-center">
			{mostTradedTokens?.map((token, index) => {
				const address = toAssetString(token.currencySymbol, token.tokenName, {
					separator: ".",
				});

				return (
					<AssetInfoTooltip
						details={tokenDetail[address]}
						key={address}
						token={token}
					>
						<Image
							alt="Token"
							className={cn("rounded-full border border-bd-pri-ter", {
								"-ml-2": index !== 0,
							})}
							height={24}
							key={address}
							src={getLogoSrc(toAssetString(token.currencySymbol, token.tokenName))}
							width={24}
						/>
					</AssetInfoTooltip>
				);
			})}
		</div>
	);
}
