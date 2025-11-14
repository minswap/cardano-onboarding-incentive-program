export type AssetComponents = {
	currencySymbol: string;
	tokenName: string;
};

export type UserTradingStats = {
	addressIdent: string;
	totalVolume: number;
	point: number;
	rank: number;
	totalTrade: number;
	reward: number;
	botConfidenceLevel: number; // the number of flags that shows a user's bot confidence level ranging from 1-3
	mostTradedTokens: AssetComponents[];
};

export type EventStats = {
	prizePoolAda: number;
	prizePoolUsd: number;
	totalTradingVolume: number;
	totalTrades: number;
	totalTraders: number;
	totalPoints: number;
	startOfBoostingWeek: string | null;
	startDate: string | null;
	endDate: string | null;
};

export type MapAddrToVolumeStats = Record<
	string,
	{
		totalPoint: number;
		totalVolumeAda: number;
		totalVolumeUsd: number;
	}
>;
