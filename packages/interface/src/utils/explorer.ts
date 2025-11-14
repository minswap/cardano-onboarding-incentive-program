export type SupportedExplorer = "cardanoscan" | "cexplorer" | "adastat";

const EXPLORER_DOMAIN: Record<SupportedExplorer, string> = {
	cardanoscan: "https://cardanoscan.io",
	cexplorer: "https://cexplorer.io",
	adastat: "https://adastat.net",
};

export function getExplorerLinkForAddress(explorer: SupportedExplorer, addr: string): string {
	switch (explorer) {
		case "adastat":
			return `${EXPLORER_DOMAIN.adastat}/addresses/${addr}`;
		case "cexplorer": {
			const addrType = addr.startsWith("stake") ? "stake" : "address";
			return `${EXPLORER_DOMAIN.cexplorer}/${addrType}/${addr}`;
		}
		case "cardanoscan":
			return `${EXPLORER_DOMAIN.cardanoscan}/address/${addr}`;
	}
}
