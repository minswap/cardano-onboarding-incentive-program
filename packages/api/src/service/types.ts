import type { EventStats, UserTradingStats } from "../cmd/point-aggregator-cron/types";
import type { AssetData } from "../cmd/point-aggregator-cron/utils";

export type EventStatsResponse = {
	data: EventStats;
};

export type ServerTimeResponse = {
	data: {
		serverTime: string;
	};
};

export type TopTradingStatsResponse = {
	data: {
		entries: UserTradingStats[];
		tokenDetail: Record<string, AssetData>;
	};
};

export type UserTradingStatsResponse = {
	data: {
		entry: UserTradingStats;
		tokenDetail: Record<string, AssetData>;
	};
};
