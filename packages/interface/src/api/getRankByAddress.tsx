import { fetchApi } from "@/lib/fetch-api";

export type AddressRankResponse = {
	data: {
		entry: {
			rank: number;
			point: number;
			totalTrade: number;
			totalVolume: number;
			reward: number;
			mostTradedTokens: {
				currencySymbol: string;
				tokenName: string;
			}[];
			addressIdent: string;
			botConfidenceLevel: number;
		};
		tokenDetail: Record<string, TokenDetail>;
	};
};

export type TokenDetail = {
	metadata: {
		name: string;
		ticker?: string;
		isVerified: boolean;
		decimals: number;
	};
	marketDetails: {
		marketCap: number;
		volume24h: number;
		price: number;
		priceChange24h: number;
	};
};

export type AddressRank = AddressRankResponse["data"];

export type RankEntry = AddressRank["entry"];

export function parseRankEntryResponse(response: AddressRankResponse): AddressRank {
	return response.data;
}

export function getRankByAddress({ address }: { address: string }): Promise<AddressRankResponse> {
	return fetchApi(`rank/address?address=${address}`).json();
}
