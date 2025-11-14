import type { UserTradingStats } from "../cmd/point-aggregator-cron/types";
import { assetToString } from "../ledger/asset";
import type { RedisRepositoryReader } from "../repository/redis-repository";
import type { TradingRankFilter } from "../repository/types";
import type {
	EventStatsResponse,
	ServerTimeResponse,
	TopTradingStatsResponse,
	UserTradingStatsResponse,
} from "./types";

export class TradingPointService {
	private readonly redisRepository: RedisRepositoryReader;

	constructor(repository: RedisRepositoryReader) {
		this.redisRepository = repository;
	}

	async getTopUserTradingStats(limit = 100, filter?: TradingRankFilter): Promise<TopTradingStatsResponse> {
		const entries = await this.redisRepository.getTopUsersByRank(limit, filter);
		const filteredEntries: UserTradingStats[] = entries;
		const uniqAssets: Set<string> = new Set();
		for (const r of filteredEntries) {
			for (const t of r.mostTradedTokens) {
				const key = assetToString(t.currencySymbol, t.tokenName);
				uniqAssets.add(key);
			}
		}
		const assetDetails = await this.redisRepository.getAssetDetailById(Array.from(uniqAssets));
		for (const id of uniqAssets) {
			if (!assetDetails[id]) {
				console.warn(`TradingPointService: Fallback asset metadata used for missing asset ${id}`);
				assetDetails[id] = {
					metadata: {
						isVerified: false,
						decimals: 0,
					},
					marketDetails: {
						marketCap: 0,
						price: 0,
						priceChange24h: 0,
						volume24h: 0,
					},
				};
			}
		}
		return {
			data: {
				entries: filteredEntries,
				tokenDetail: assetDetails,
			},
		};
	}

	async getUserTradingStatsByAddress(addr: string): Promise<UserTradingStatsResponse> {
		const rank = await this.redisRepository.getUserTradingStats(addr);
		const assetIds: string[] = [];
		for (const t of rank.mostTradedTokens) {
			const key = assetToString(t.currencySymbol, t.tokenName);
			assetIds.push(key);
		}
		const assetDetails = await this.redisRepository.getAssetDetailById(assetIds);
		for (const id of assetIds) {
			if (!assetDetails[id]) {
				assetDetails[id] = {
					metadata: {
						isVerified: false,
						decimals: 0,
					},
					marketDetails: {
						marketCap: 0,
						price: 0,
						priceChange24h: 0,
						volume24h: 0,
					},
				};
			}
		}
		return {
			data: {
				entry: rank,
				tokenDetail: assetDetails,
			},
		};
	}

	async getEventStats(): Promise<EventStatsResponse> {
		return {
			data: await this.redisRepository.getEventStats(),
		};
	}

	async getServerTime(): Promise<ServerTimeResponse> {
		return {
			data: {
				serverTime: Date.now().toString(),
			},
		};
	}
}
