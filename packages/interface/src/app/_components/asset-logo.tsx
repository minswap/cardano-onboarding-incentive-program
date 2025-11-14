import { RiVerifiedBadgeFill } from "@remixicon/react";
import Image from "next/image";
import { toAssetString } from "@/utils/asset";
import { getLogoSrc } from "./ranking/common";

type Props = {
	currencySymbol: string;
	tokenName: string;
	isVerified?: boolean;
};

export function AssetLogo({ currencySymbol, tokenName, isVerified }: Props) {
	return (
		<div className="inline-block size-7 shrink-0 relative">
			<Image
				alt="Token"
				className="rounded-full"
				height={24}
				src={getLogoSrc(toAssetString(currencySymbol, tokenName))}
				width={24}
			/>
			{isVerified && (
				<div className="absolute -bottom-1 -right-1 border size-4 border-sf-pri-sub rounded-full bg-base-bg flex items-center justify-center">
					<RiVerifiedBadgeFill className="size-3 shrink-0 text-itr-tone-hl" />
				</div>
			)}
		</div>
	);
}
