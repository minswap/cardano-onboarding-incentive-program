import { CONFIG } from "@/constants/config";

export function getLogoSrc(asset: string): string {
	// always use the dark min logo
	return `${CONFIG.NEXT_PUBLIC_ASSET_LOGO_URL}/${asset}`;
}
