import type Redis from "ioredis";
import type { EventStats, UserTradingStats } from "../cmd/point-aggregator-cron/types";
import type { AssetData } from "../cmd/point-aggregator-cron/utils";
import type { RedisReadOnly } from "../database/redis";
import { extractAddressIdent } from "../ledger/address";
import { type PriceChart, SupportedCoin } from "../service/historical-price/types";
import { tryParseBigInt } from "../utils";
import { RedisKey, type TradingRankFilter } from "./types";

export class RedisRepositoryReader {
	protected readonly redis: RedisReadOnly;

	constructor(redis: RedisReadOnly) {
		this.redis = redis;
	}

	async getUserTradingStatsByRank(end: number = -1, filter?: TradingRankFilter): Promise<UserTradingStats[]> {
		if (filter === undefined) {
			const userAddresses = await this.redis.zrange(RedisKey.USER_TRADING_STATS_BY_RANK, 0, end);

			if (userAddresses.length === 0) {
				return [];
			}

			const userStatsStrings = await this.redis.hmget(RedisKey.USER_TRADING_STATS, ...userAddresses);

			const tradingStats: UserTradingStats[] = [];

			for (let i = 0; i < userAddresses.length; i++) {
				const statsString = userStatsStrings[i];
				if (statsString) {
					tradingStats.push(JSON.parse(statsString) as UserTradingStats);
				}
			}

			return tradingStats;
		} else {
			const batchSize = 1000;
			let currentStart = 0;
			const result: UserTradingStats[] = [];
			let found = 0;

			const targetCount = end === -1 ? Number.MAX_SAFE_INTEGER : end + 1;

			while (true) {
				const userAddresses = await this.redis.zrange(
					RedisKey.USER_TRADING_STATS_BY_RANK,
					currentStart,
					currentStart + batchSize - 1,
				);

				if (userAddresses.length === 0) {
					break;
				}

				const userStatsStrings = await this.redis.hmget(RedisKey.USER_TRADING_STATS, ...userAddresses);

				for (let i = 0; i < userAddresses.length; i++) {
					const statsString = userStatsStrings[i];
					if (statsString) {
						const stats = JSON.parse(statsString) as UserTradingStats;

						const matchesFilter = filter === "bot" ? stats.botConfidenceLevel >= 1 : stats.botConfidenceLevel < 1;

						if (matchesFilter) {
							if (found < targetCount) {
								result.push(stats);
								found++;
							}
							if (found >= targetCount) {
								return result;
							}
						}
					}
				}

				currentStart += batchSize;
			}

			return result;
		}
	}

	async getTopUsersByRank(limit: number, filter?: TradingRankFilter): Promise<UserTradingStats[]> {
		const ranks = await this.getUserTradingStatsByRank(limit - 1, filter);
		return Object.values(ranks);
	}

	async getUserTradingStats(userAddress: string): Promise<UserTradingStats> {
		const addressIdent = extractAddressIdent(userAddress).bech32;
		const statsString = await this.redis.hget(RedisKey.USER_TRADING_STATS, addressIdent);
		if (statsString) {
			const res = JSON.parse(statsString) as UserTradingStats;
			return res;
		}
		return {
			addressIdent: addressIdent,
			totalVolume: 0,
			point: 0,
			rank: -1,
			totalTrade: 0,
			reward: 0,
			botConfidenceLevel: 0,
			mostTradedTokens: [],
		};
	}

	async getEventStats(): Promise<EventStats> {
		const eventStats = await this.redis.get(RedisKey.EVENT_STATS);

		return eventStats
			? (JSON.parse(eventStats) as EventStats)
			: {
					prizePoolAda: 0,
					prizePoolUsd: 0,
					totalTradingVolume: 0,
					totalPoints: 0,
					totalTrades: 0,
					totalTraders: 0,
					startDate: null,
					endDate: null,
					startOfBoostingWeek: null,
				};
	}

	async getLatestAssetPrice(coin: SupportedCoin): Promise<number | null> {
		const price = await this.redis.hget(RedisKey.ASSET_PRICE_LATEST, coin);
		return price ? parseFloat(price) : null;
	}

	async getAllLatestAssetPrices(): Promise<Record<SupportedCoin, number | null>> {
		const prices = await this.redis.hgetall(RedisKey.ASSET_PRICE_LATEST);
		const result: Record<SupportedCoin, number | null> = {
			[SupportedCoin.ADA]: null,
			[SupportedCoin.BTC]: null,
			[SupportedCoin.ETH]: null,
			[SupportedCoin.SOL]: null,
		};

		for (const coin of Object.values(SupportedCoin)) {
			result[coin] = prices[coin] ? parseFloat(prices[coin]) : null;
		}

		return result;
	}

	async getLatestAssetTimestamps(): Promise<Record<SupportedCoin, Date | null>> {
		const result: Record<SupportedCoin, Date | null> = {
			[SupportedCoin.ADA]: null,
			[SupportedCoin.BTC]: null,
			[SupportedCoin.ETH]: null,
			[SupportedCoin.SOL]: null,
		};

		for (const coin of Object.values(SupportedCoin)) {
			const key = `${RedisKey.ASSET_PRICE_HISTORY}:${coin}`;
			const latestRecord = await this.redis.zrange(key, -1, -1, "WITHSCORES");
			if (latestRecord.length >= 2) {
				const timestamp = parseFloat(latestRecord[1]);
				result[coin] = new Date(timestamp);
			} else {
				result[coin] = null;
			}
		}

		return result;
	}

	async getAssetPriceAt(coin: SupportedCoin, timestamp: Date): Promise<number | null> {
		const timestampScore = timestamp.getTime();
		const key = `${RedisKey.ASSET_PRICE_HISTORY}:${coin}`;

		const results = await this.redis.zrevrangebyscore(key, timestampScore, "-inf", "WITHSCORES", "LIMIT", 0, 1);

		if (results.length >= 2) {
			const member = results[0];
			const price = parseFloat(member.split(":")[0]);
			return price;
		}

		return null;
	}

	async getAssetPriceHistory(
		coin: SupportedCoin,
		fromTimestamp: Date,
		toTimestamp: Date,
		limit: number = 1000,
	): Promise<{ price: number; timestamp: Date }[]> {
		const key = `${RedisKey.ASSET_PRICE_HISTORY}:${coin}`;
		const fromScore = fromTimestamp.getTime();
		const toScore = toTimestamp.getTime();

		const results = await this.redis.zrangebyscore(key, fromScore, toScore, "WITHSCORES", "LIMIT", 0, limit);

		const history: { price: number; timestamp: Date }[] = [];
		for (let i = 0; i < results.length; i += 2) {
			const member = results[i];
			const price = parseFloat(member.split(":")[0]);
			const timestampScore = parseInt(results[i + 1]);
			const timestamp = new Date(timestampScore);
			history.push({ price, timestamp });
		}

		return history;
	}

	async getAllAssetPriceHistory(from: Date, to: Date): Promise<Record<string, PriceChart[]>> {
		const result: Record<string, PriceChart[]> = {};

		const promises = Object.values(SupportedCoin).map(async (coin) => {
			try {
				const paginatedResult = await this.getAssetPriceHistoryPaginated(coin, from, to, 0, 10000);
				result[coin] = paginatedResult.data;
			} catch (error) {
				console.warn(`Failed to fetch price history for ${coin}:`, error);
				result[coin] = [];
			}
		});

		await Promise.all(promises);
		return result;
	}

	async getAssetPriceHistoryPaginated(
		coin: SupportedCoin,
		fromTimestamp: Date,
		toTimestamp: Date,
		page: number = 0,
		pageSize: number = 1000,
	): Promise<{
		data: PriceChart[];
		hasMore: boolean;
		totalCount: number;
	}> {
		const key = `${RedisKey.ASSET_PRICE_HISTORY}:${coin}`;
		const fromScore = fromTimestamp.getTime();
		const toScore = toTimestamp.getTime();
		const totalCount = await this.redis.zcount(key, fromScore, toScore);
		const offset = page * pageSize;
		const results = await this.redis.zrangebyscore(key, fromScore, toScore, "WITHSCORES", "LIMIT", offset, pageSize);

		const history: PriceChart[] = [];
		for (let i = 0; i < results.length; i += 2) {
			const member = results[i];
			const price = parseFloat(member.split(":")[0]);
			const timestampScore = parseInt(results[i + 1]);
			const timestamp = new Date(timestampScore);
			history.push({ coin, price, timestamp });
		}

		return {
			data: history,
			hasMore: offset + pageSize < totalCount,
			totalCount,
		};
	}

	async getMapAssetDetails(): Promise<Record<string, AssetData>> {
		const res = await this.redis.hgetall(RedisKey.ASSET_METADATA);
		const assetDetailsMap: Record<string, AssetData> = {};
		for (const [key, value] of Object.entries(res)) {
			if (value) {
				assetDetailsMap[key] = JSON.parse(value) as AssetData;
			}
		}
		return assetDetailsMap;
	}

	async getAssetDetailById(ids: string[]): Promise<Record<string, AssetData>> {
		if (ids.length === 0) {
			return {};
		}
		const res = await this.redis.hmget(RedisKey.ASSET_METADATA, ...ids);
		const assetDetailsMap: Record<string, AssetData> = {};
		for (let i = 0; i < ids.length; i++) {
			const value = res[i];
			if (value) {
				assetDetailsMap[ids[i]] = JSON.parse(value) as AssetData;
			}
		}

		return assetDetailsMap;
	}

	/**
	 * Get amounts for fee switch pool prize calculations.
	 * @returns excludedFeeSwitch The fee sharing amount is collected month by month. If the event starts in the middle of the month, this is fee sharing generated before the event start time.
	 * @returns accMonthlyFeeSwitch Accumulate fee sharing amount after each month.
	 */
	async getMagicFeeSwitchAmount(): Promise<{
		excludedFeeSwitch: bigint;
		accMonthlyFeeSwitch: bigint;
	}> {
		const [excludedFeeSwitchAmountStr, totalMonthlyAccFeeSwitchStr] = await this.redis.mget(
			RedisKey.EXCLUDED_FEE_SWITCH_AMOUNT,
			RedisKey.ACC_MONTHLY_FEE_SWITCH_AMOUNT,
		);
		let excludedFeeSwitchAmount = 0n;
		let totalMonthlyAccFeeSwitch = 0n;
		if (excludedFeeSwitchAmountStr) {
			excludedFeeSwitchAmount = tryParseBigInt(excludedFeeSwitchAmountStr) ?? 0n;
		}
		if (totalMonthlyAccFeeSwitchStr) {
			totalMonthlyAccFeeSwitch = tryParseBigInt(totalMonthlyAccFeeSwitchStr) ?? 0n;
		}
		return {
			excludedFeeSwitch: excludedFeeSwitchAmount,
			accMonthlyFeeSwitch: totalMonthlyAccFeeSwitch,
		};
	}
}

export class RedisRepositoryWriter extends RedisRepositoryReader {
	protected override readonly redis: Redis;

	constructor(redis: Redis) {
		super(redis);
		this.redis = redis;
	}

	async setEventStats(eventStats: EventStats): Promise<void> {
		await this.redis.set(RedisKey.EVENT_STATS, JSON.stringify(eventStats));
	}

	async setUserTradingStats(userTradingStats: Record<string, UserTradingStats>): Promise<void> {
		const data: string[] = [];
		const sortedSetData: { score: number; member: string }[] = [];

		for (const [user, tradingStats] of Object.entries(userTradingStats)) {
			data.push(user, JSON.stringify(tradingStats));
			sortedSetData.push({ score: tradingStats.rank, member: user });
		}

		if (data.length === 0) {
			await this.redis.multi().del(RedisKey.USER_TRADING_STATS).del(RedisKey.USER_TRADING_STATS_BY_RANK).exec();
			return;
		}

		if (sortedSetData.length === 0) {
			console.warn("Attempting to set user trading stats with empty data");
			return;
		}

		const zaddArgs = sortedSetData.flatMap((item) => [item.score, item.member]);

		if (zaddArgs.length === 0) {
			console.warn("No ZADD arguments to process");
			return;
		}

		try {
			await this.redis
				.multi()
				.del(RedisKey.USER_TRADING_STATS)
				.hset(RedisKey.USER_TRADING_STATS, data)
				.del(RedisKey.USER_TRADING_STATS_BY_RANK)
				.zadd(RedisKey.USER_TRADING_STATS_BY_RANK, ...zaddArgs)
				.exec();

			console.log("Successfully set user trading stats");
		} catch (error) {
			console.error("Error setting user trading stats:", error);
			console.error("Data length:", data.length);
			console.error("ZADD args length:", zaddArgs.length);
			throw error;
		}
	}

	async setAssetPrice(coin: SupportedCoin, price: number, timestamp: Date): Promise<void> {
		const timestampScore = timestamp.getTime();
		const key = `${RedisKey.ASSET_PRICE_HISTORY}:${coin}`;

		await this.redis
			.multi()
			.zadd(key, timestampScore, `${price}:${timestampScore}`)
			.hset(RedisKey.ASSET_PRICE_LATEST, coin, price.toString())
			.exec();
	}

	async setAssetPrices(prices: { coin: SupportedCoin; price: number; timestamp: Date }[]): Promise<void> {
		if (prices.length === 0) return;

		const multi = this.redis.multi();

		for (const { coin, price, timestamp } of prices) {
			const timestampScore = timestamp.getTime();
			const key = `${RedisKey.ASSET_PRICE_HISTORY}:${coin}`;

			multi.zadd(key, timestampScore, `${price}:${timestampScore}`);
			multi.hset(RedisKey.ASSET_PRICE_LATEST, coin, price.toString());
		}

		await multi.exec();
	}

	async setAssetDetails(mapAssetDetails: Record<string, AssetData>): Promise<void> {
		const data: string[] = [];
		for (const [key, detail] of Object.entries(mapAssetDetails)) {
			data.push(key, JSON.stringify(detail));
		}
		if (data.length === 0) {
			return;
		}
		const multi = this.redis.multi();
		multi.hset(RedisKey.ASSET_METADATA, ...data);
		multi.expire(RedisKey.ASSET_METADATA, 24 * 60 * 60); // 24 hours
		await multi.exec();
	}
}
