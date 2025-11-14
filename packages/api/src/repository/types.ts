// POSTGRES
export enum DEX_VERSION {
	V1 = "dex_syncer",
	V2 = "dex_v2_syncer",
	STABLE = "stableswap_syncer",
}

// REDIS
export enum RedisKey {
	USER_TRADING_STATS = "user:trading-rank",
	USER_TRADING_STATS_BY_RANK = "user:trading-rank:sorted",
	EVENT_STATS = "event:stats",
	ACC_MONTHLY_FEE_SWITCH_AMOUNT = "event:fee-switch:month:accumulate",
	EXCLUDED_FEE_SWITCH_AMOUNT = "event:fee-switch:month:excluded",
	PRICE = "asset:price",
	ASSET_PRICE_LATEST = "asset:price:latest",
	ASSET_PRICE_HISTORY = "asset:price:history",
	ASSET_METADATA = "asset:metadata",
}

export type TradingRankFilter = "bot" | "human";
