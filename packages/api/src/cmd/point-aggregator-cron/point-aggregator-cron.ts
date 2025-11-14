import invariant from "@minswap/tiny-invariant";
import BigNumber from "bignumber.js";
import DBClient from "../../database/postgres";
import { RedisClient } from "../../database/redis";
import { ADA_DECIMALS, Asset, assetToString } from "../../ledger/asset";
import { PostgresRepository } from "../../repository/postgres-repository";
import { RedisRepositoryWriter } from "../../repository/redis-repository";
import { Binance } from "../../service/historical-price/binance";
import { type PriceChart, SupportedCoin } from "../../service/historical-price/types";
import { decimalToBigInt, onShutdown, toNumberWithDecimal } from "../../utils";
import { getPointAggrConfig, type PointAggrCronConfig } from "./configs";
import {
	BASE_PRIZE_POOL,
	BOT_BLACKLIST,
	CROSS_CHAIN_ASSETS,
	DEFAULT_POOL_ALLOC_DEN,
	MAX_USER_TIER_1,
	MAX_USER_TIER_2,
	POOL_ALLOC_TIER_1,
	POOL_ALLOC_TIER_2,
	STABLE_ASSET_DECIMALS,
	STABLE_ASSETS,
} from "./constants";
import type { AssetComponents, EventStats, MapAddrToVolumeStats, UserTradingStats } from "./types";
import {
	type AssetData,
	findUpperBound,
	getAssetMultiplier,
	getFeeSwitchPoolPrizeInMonth,
	getMapAssetMetadata,
} from "./utils";

const SERVICE_NAME = "trading-point-cron";

const A_WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

let isJobRunning = false;

class PointAggrCron {
	private readonly postgresRepository: PostgresRepository;
	private readonly redisRepository: RedisRepositoryWriter;
	private readonly assetPrices: Record<string, PriceChart[]>;
	private readonly mapAssetDetails: Record<string, AssetData>;
	private readonly config: PointAggrCronConfig;

	constructor(
		repository: PostgresRepository,
		redisRepository: RedisRepositoryWriter,
		assetPrices: Record<string, PriceChart[]>,
		mapAssetDetails: Record<string, AssetData>,
		config: PointAggrCronConfig,
	) {
		this.postgresRepository = repository;
		this.redisRepository = redisRepository;
		this.assetPrices = assetPrices;
		this.mapAssetDetails = mapAssetDetails;
		this.config = config;
	}

	// MARK: POINT AGGREGATOR
	async aggregateTradingStats(eventStartDate: Date, eventEndDate: Date, _excludeBlacklist: boolean): Promise<void> {
		const now = new Date(Date.now());
		const finalWeekStartDate = new Date(eventEndDate.getTime() - A_WEEK_IN_MILLISECONDS);
		const [
			mapUserTradedTokenStats,
			mapAddrToV1PointStats,
			mapAddrToV2PointStats,
			mapAddrToStablePointStats,
			dexV1Trades,
			dexV2Trades,
			dexStableTrades,
			totalPoolPrize,
		] = await Promise.all([
			this.getUserTradedTokenStats(eventStartDate, eventEndDate),
			this.aggregateDexV1TradingStat(eventStartDate, eventEndDate, finalWeekStartDate),
			this.aggregateDexV2TradingStat(eventStartDate, eventEndDate, finalWeekStartDate),
			this.aggregateStableTradingStat(eventStartDate, eventEndDate, finalWeekStartDate),
			this.postgresRepository.getDexV1TradesDate(eventStartDate, eventEndDate),
			this.postgresRepository.getDexV2TradesByDate(eventStartDate, eventEndDate),
			this.postgresRepository.getStableTradesByDate(eventStartDate, eventEndDate),
			this.getTotalAccPrizePool(now),
		]);

		const endDateToUse = now >= eventEndDate ? eventEndDate : now;
		const tradingPeriod = (endDateToUse.getTime() - eventStartDate.getTime()) / (24 * 60 * 60 * 1000);
		const aggregateTradingFrequency = this.aggregateTradingFrequencyPoint(
			dexV1Trades.mapAddrTotalTrade,
			dexV2Trades.mapAddrTotalTrade,
			dexStableTrades.mapAddrTotalTrade,
			tradingPeriod,
		);

		const mapAddrTradingPoint: MapAddrToVolumeStats = {};
		let totalVolume: number = 0;
		const totalTrades: number = dexV1Trades.totalTrades + dexStableTrades.totalTrades + dexV2Trades.totalTrades;

		for (const [addr, tradingStats] of Object.entries(mapAddrToV1PointStats)) {
			if (BOT_BLACKLIST.includes(addr)) {
				continue;
			}
			if (!mapAddrTradingPoint[addr]) {
				mapAddrTradingPoint[addr] = {
					totalPoint: 0,
					totalVolumeAda: 0,
					totalVolumeUsd: 0,
				};
			}
			mapAddrTradingPoint[addr].totalPoint += tradingStats.totalPoint;
			mapAddrTradingPoint[addr].totalVolumeAda += tradingStats.totalVolumeAda;
			mapAddrTradingPoint[addr].totalVolumeUsd += tradingStats.totalVolumeUsd;
			totalVolume += tradingStats.totalVolumeAda;
		}

		for (const [addr, tradingStats] of Object.entries(mapAddrToV2PointStats)) {
			if (BOT_BLACKLIST.includes(addr)) {
				continue;
			}
			if (!mapAddrTradingPoint[addr]) {
				mapAddrTradingPoint[addr] = {
					totalPoint: 0,
					totalVolumeAda: 0,
					totalVolumeUsd: 0,
				};
			}
			mapAddrTradingPoint[addr].totalPoint += tradingStats.totalPoint;
			mapAddrTradingPoint[addr].totalVolumeAda += tradingStats.totalVolumeAda;
			mapAddrTradingPoint[addr].totalVolumeUsd += tradingStats.totalVolumeUsd;
			totalVolume += tradingStats.totalVolumeAda;
		}

		for (const [addr, tradingStats] of Object.entries(mapAddrToStablePointStats)) {
			if (BOT_BLACKLIST.includes(addr)) {
				continue;
			}
			if (!mapAddrTradingPoint[addr]) {
				mapAddrTradingPoint[addr] = {
					totalPoint: 0,
					totalVolumeAda: 0,
					totalVolumeUsd: 0,
				};
			}
			mapAddrTradingPoint[addr].totalPoint += tradingStats.totalPoint;
			mapAddrTradingPoint[addr].totalVolumeAda += tradingStats.totalVolumeAda;
			mapAddrTradingPoint[addr].totalVolumeUsd += tradingStats.totalVolumeUsd;
			totalVolume += tradingStats.totalVolumeAda;
		}

		const sortedUserTradingPoints = Object.entries(mapAddrTradingPoint).sort(
			([, tradingStatA], [, tradingStatB]) => tradingStatB.totalPoint - tradingStatA.totalPoint,
		);

		let totalPointTopTier1: number = 0;
		let totalPointTopTier2: number = 0;
		const totalTopUser = Math.min(MAX_USER_TIER_1 + MAX_USER_TIER_2, sortedUserTradingPoints.length);
		for (let i = 0; i < totalTopUser; i++) {
			const [, stats] = sortedUserTradingPoints[i];
			if (i < MAX_USER_TIER_1) {
				totalPointTopTier1 += stats.totalPoint;
			} else {
				totalPointTopTier2 += stats.totalPoint;
			}
		}

		const res: Record<string, UserTradingStats> = {};
		const remainAssetIds: Set<string> = new Set();
		let totalPoint: number = 0;

		for (let i = 0; i < sortedUserTradingPoints.length; i++) {
			const [addr, stats] = sortedUserTradingPoints[i];
			const index = Number(i + 1);
			let reward: number = 0;

			if (index <= MAX_USER_TIER_1) {
				reward =
					(stats.totalPoint / totalPointTopTier1) *
					((totalPoolPrize.prizePoolAda * POOL_ALLOC_TIER_1) / DEFAULT_POOL_ALLOC_DEN);
			} else if (index <= MAX_USER_TIER_1 + MAX_USER_TIER_2) {
				reward =
					(stats.totalPoint / totalPointTopTier2) *
					((totalPoolPrize.prizePoolAda * POOL_ALLOC_TIER_2) / DEFAULT_POOL_ALLOC_DEN);
			}

			const userTotalTradeV1 = dexV1Trades.mapAddrTotalTrade.get(addr) ?? 0;
			const userTotalTradeV2 = dexV2Trades.mapAddrTotalTrade.get(addr) ?? 0;
			const userTotalTradeStable = dexStableTrades.mapAddrTotalTrade.get(addr) ?? 0;
			const totalTrades = userTotalTradeV1 + userTotalTradeV2 + userTotalTradeStable;

			const avgVolumePerDay = stats.totalPoint / totalTrades;
			const efficiencySignalPoint = this.getEfficiencySignalPoint(avgVolumePerDay);
			let botConfidencePoint = (aggregateTradingFrequency[addr] ?? 0) + efficiencySignalPoint;

			const userTradedTokensStats = mapUserTradedTokenStats[addr];
			if (userTradedTokensStats) {
				for (const token of userTradedTokensStats.mostTradedTokens) {
					const key = assetToString(token.currencySymbol, token.tokenName);
					if (!this.mapAssetDetails[key]) {
						remainAssetIds.add(key);
					}
				}
				botConfidencePoint += userTradedTokensStats.botConfidencePoint;
			}

			// whale bot pattern
			if (stats.totalVolumeUsd > 100_000_000 && totalTrades < 300) {
				botConfidencePoint += 4;
			} else if (stats.totalVolumeUsd > 400_000 && totalTrades < 100) {
				botConfidencePoint += 3;
			} else if (stats.totalVolumeUsd > 200_000 && totalTrades < 50) {
				botConfidencePoint += 2;
			}

			const botConfidenceLevel = this.calculateBotConfidenceLevel(botConfidencePoint);

			res[addr] = {
				addressIdent: addr,
				rank: index,
				point: stats.totalPoint,
				totalTrade: totalTrades,
				totalVolume: stats.totalVolumeAda ?? 0,
				reward: Math.floor(reward),
				mostTradedTokens: userTradedTokensStats?.mostTradedTokens ?? [],
				botConfidenceLevel: botConfidenceLevel,
			};
			totalPoint += stats.totalPoint;
		}

		if (remainAssetIds.size > 0) {
			const remainAssetDetails: Record<string, AssetData> = await getMapAssetMetadata(
				[...remainAssetIds],
				this.config.thirdPartyApiUrl,
			);
			for (const [key, detail] of Object.entries(remainAssetDetails)) {
				this.mapAssetDetails[key] = detail;
			}
		}

		const eventInfo: EventStats = {
			prizePoolAda: totalPoolPrize.prizePoolAda,
			prizePoolUsd: totalPoolPrize.prizePoolUsd,
			totalTradingVolume: totalVolume,
			totalPoints: totalPoint,
			totalTrades: totalTrades,
			totalTraders: Object.keys(res).length,
			startDate: eventStartDate.toISOString(),
			endDate: eventEndDate.toISOString(),
			startOfBoostingWeek: finalWeekStartDate.toISOString(),
		};

		await Promise.all([
			this.redisRepository.setUserTradingStats(res),
			this.redisRepository.setEventStats(eventInfo),
			this.redisRepository.setAssetDetails(this.mapAssetDetails),
		]);
	}

	/**
	 * Aggregate users' total volume ada/usd traded on Minswap Stableswap and efficiencySignals and bot confidence point aggregated from unusual large trade (efficiency signals).
	 * @param: from - start of the period to get events
	 * 		to - end of the period to get events
	 * @returns A map of address to total volume ada/usd.
	 */
	private async aggregateStableTradingStat(
		from: Date,
		to: Date,
		finalWeekStartDate: Date,
	): Promise<MapAddrToVolumeStats> {
		const stableTradingEvents = await this.postgresRepository.getStableTradingEvent(from, to);
		const res: MapAddrToVolumeStats = {};

		for (const tradingEvent of stableTradingEvents) {
			const assetInId = tradingEvent.asset_in;
			const assetDecimal = STABLE_ASSET_DECIMALS[assetInId];
			invariant(assetDecimal, `Unsupported stable asset, asset id: ${assetInId}`);
			const coin = CROSS_CHAIN_ASSETS[assetInId];
			let volumeInAda: number;
			let volumeInUsd: number;

			if (coin) {
				const [coinPrice, adaPrice] = await Promise.all([
					this.findAssetUsdPriceAt(coin, tradingEvent.batched_at),
					this.findAssetUsdPriceAt(SupportedCoin.ADA, tradingEvent.batched_at),
				]);
				const volume = decimalToBigInt(tradingEvent.amount_in);
				volumeInUsd = new BigNumber(toNumberWithDecimal(volume, assetDecimal)).multipliedBy(coinPrice).toNumber();
				volumeInAda = volumeInUsd / adaPrice;
			} else {
				const adaPrice = await this.findAssetUsdPriceAt(SupportedCoin.ADA, tradingEvent.batched_at);
				volumeInUsd = toNumberWithDecimal(decimalToBigInt(tradingEvent.amount_in), assetDecimal);
				volumeInAda = volumeInUsd / adaPrice;
			}

			const senderIdent = tradingEvent.sender_stake_address ?? tradingEvent.sender;

			if (!res[senderIdent]) {
				res[senderIdent] = {
					totalVolumeAda: 0,
					totalVolumeUsd: 0,
					totalPoint: 0,
				};
			}
			let point = volumeInAda;
			if (tradingEvent.created_at >= finalWeekStartDate) {
				point *= 2;
			}

			res[senderIdent].totalVolumeAda += volumeInAda;
			res[senderIdent].totalVolumeUsd += volumeInUsd;
			res[senderIdent].totalPoint += point;
		}
		return res;
	}

	/**
	 * Aggregate users' total volume ada/usd traded on MinswapAmmV1 and efficiencySignals and bot confidence point aggregated from unusual large trade (efficiency signals).
	 * @param: from - start of the period to get events
	 * 		to - end of the period to get events
	 * @returns A map of address to total volume ada/usd.
	 */
	private async aggregateDexV1TradingStat(
		from: Date,
		to: Date,
		finalWeekStartDate: Date,
	): Promise<MapAddrToVolumeStats> {
		const dexV1TradingEvents = await this.postgresRepository.getV1TradingEvent(from, to);
		const res: MapAddrToVolumeStats = {};

		for (const tradingEvent of dexV1TradingEvents) {
			const assetId = tradingEvent.asset_in === "lovelace" ? tradingEvent.asset_out : tradingEvent.asset_in;
			const volumeAdaWithDecimals = toNumberWithDecimal(decimalToBigInt(tradingEvent.volume_ada), ADA_DECIMALS);
			const adaPrice = await this.findAssetUsdPriceAt(SupportedCoin.ADA, tradingEvent.batched_at);
			const volumeInUsd = volumeAdaWithDecimals * adaPrice;

			const senderIdent = tradingEvent.sender_stake_address ?? tradingEvent.sender;

			if (!res[senderIdent]) {
				res[senderIdent] = {
					totalVolumeAda: 0,
					totalVolumeUsd: 0,
					totalPoint: 0,
				};
			}
			const multiplier = getAssetMultiplier(assetId);
			let point = volumeAdaWithDecimals * multiplier;

			if (tradingEvent.created_at >= finalWeekStartDate) {
				point *= 2;
			}
			res[senderIdent].totalVolumeAda += volumeAdaWithDecimals;
			res[senderIdent].totalVolumeUsd += volumeInUsd;
			res[senderIdent].totalPoint += point;
		}
		return res;
	}

	/**
	 * Aggregate users' total volume ada/usd traded on MinswapAmmV2 and efficiencySignals and bot confidence point aggregated from unusual large trade (efficiency signals).
	 * @param: from - start of the period to get events
	 * 		to - end of the period to get events
	 * @returns A map of address to total volume ada/usd, efficiency signals point.
	 */
	private async aggregateDexV2TradingStat(from: Date, to: Date, startOfFinalWeek: Date): Promise<MapAddrToVolumeStats> {
		const dexV2TradingEvents = await this.postgresRepository.getV2TradingEvent(from, to);
		const res: MapAddrToVolumeStats = {};
		// sender ident -> created tx id -> point
		const groupUserPointByTrades: Map<string, Map<string, number>> = new Map();
		for (const tradingEvent of dexV2TradingEvents) {
			const assetId = tradingEvent.asset_in === "lovelace" ? tradingEvent.asset_out : tradingEvent.asset_in;
			const volumeAdaWithDecimals = toNumberWithDecimal(decimalToBigInt(tradingEvent.volume_ada), ADA_DECIMALS);
			const adaPrice = await this.findAssetUsdPriceAt(SupportedCoin.ADA, tradingEvent.batched_at);
			const volumeInUsd = volumeAdaWithDecimals * adaPrice;

			const senderIdent = tradingEvent.sender_stake_address ?? tradingEvent.sender;

			if (!res[senderIdent]) {
				res[senderIdent] = {
					totalVolumeAda: 0,
					totalVolumeUsd: 0,
					totalPoint: 0,
				};
			}
			const multiplier = getAssetMultiplier(assetId);
			let point = volumeAdaWithDecimals * multiplier;
			if (tradingEvent.created_at >= startOfFinalWeek) {
				point *= 2;
			}

			res[senderIdent].totalVolumeAda += volumeAdaWithDecimals;
			res[senderIdent].totalVolumeUsd += volumeInUsd;
			res[senderIdent].totalPoint += point;

			let tradePoint = groupUserPointByTrades.get(senderIdent);
			const key = `${tradingEvent.created_tx_id}#${tradingEvent.created_tx_index}`;
			if (!tradePoint) {
				tradePoint = new Map();
				tradePoint.set(key, point);
				groupUserPointByTrades.set(senderIdent, tradePoint);
			} else {
				const prevPoint = tradePoint.get(key) ?? 0;
				tradePoint.set(key, prevPoint + point);
			}
		}

		return res;
	}

	private async findAssetUsdPriceAt(coin: SupportedCoin, date: Date): Promise<number> {
		invariant(this.assetPrices[coin], `Asset ${coin} is not supported or cached.`);
		const assetPrice = this.assetPrices[coin];
		assetPrice.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		const index = findUpperBound(assetPrice, date.getTime(), (pc, t) => pc.timestamp.getTime() - t);
		if (index === 0) {
			return assetPrice[index].price;
		}
		if (index !== null) {
			// prioritize the lower bound if within 5 minutes
			const priceLowerBound = assetPrice[index - 1];
			if (priceLowerBound.timestamp.getTime() - date.getTime() < 5 * 60 * 1000) {
				return priceLowerBound.price;
			}
			// return upper bound if within 5 minutes
			const coinPriceUpperBound = assetPrice[index];
			if (coinPriceUpperBound.timestamp.getTime() - date.getTime() < 5 * 60 * 1000) {
				return coinPriceUpperBound.price;
			}
		}

		// if the `date` is recent with with first or last price
		if (assetPrice.length > 0) {
			const first = assetPrice[0];
			if (first.timestamp.getTime() - date.getTime() < 1 * 60 * 1000) {
				return first.price;
			}

			const last = assetPrice[assetPrice.length - 1];
			if (last.timestamp.getTime() - date.getTime() < 1 * 60 * 1000) {
				return last.price;
			}
		}

		// if price not found or not close enough, find the ada price from external service.
		try {
			const price = await Binance.getPriceAt(coin, date);
			if (price) {
				await this.redisRepository.setAssetPrice(coin, price, date);
				return price;
			}
		} catch (error) {
			console.error(`Failed to fetch ${coin} price from Binance at ${date.toISOString()}:`, error);
		}

		// re-try lower bound price without threshold
		if (index !== null) {
			return assetPrice[index - 1].price;
		}

		console.warn(`Missing ${coin} price at: ${date.toISOString()}`);
		return 0;
	}

	private async getUserTradedTokenStats(
		from: Date,
		to: Date,
		numberOfMostTradedTokenToTake = 3,
	): Promise<
		Record<
			string,
			{
				mostTradedTokens: {
					currencySymbol: string;
					tokenName: string;
				}[];
				botConfidencePoint: number;
			}
		>
	> {
		const [dexMapAssetTradeCount, dexV2MapTrades, stableMapAssetTradeCount] = await Promise.all([
			this.postgresRepository.getV1MapAssetTradeCountByAddress(from, to),
			this.postgresRepository.getV2TradingEvent(from, to),
			this.postgresRepository.getStableMapAssetTradeCountByAddress(from, to),
		]);

		const mapSenderToTotalAssetTradeCount: Record<string, Record<string, number>> = {};

		for (const trade of Object.values(dexV2MapTrades)) {
			const assetIn = trade.asset_in;
			const assetOut = trade.asset_out;
			const senderIdent = trade.sender_stake_address ?? trade.sender;
			let assetId: string;

			if (assetIn === "lovelace") {
				assetId = assetOut;
			} else if (assetOut === "lovelace") {
				assetId = assetIn;
			} else {
				// not ADA-X trade
				continue;
			}

			if (!mapSenderToTotalAssetTradeCount[senderIdent]) {
				mapSenderToTotalAssetTradeCount[senderIdent] = {};
			}

			if (!mapSenderToTotalAssetTradeCount[senderIdent][assetId]) {
				mapSenderToTotalAssetTradeCount[senderIdent][assetId] = 1;
			} else {
				mapSenderToTotalAssetTradeCount[senderIdent][assetId] += 1;
			}
		}

		for (const addr of Object.keys(dexMapAssetTradeCount)) {
			if (!mapSenderToTotalAssetTradeCount[addr]) {
				mapSenderToTotalAssetTradeCount[addr] = {};
			}

			for (const [asset, tradeCount] of Object.entries(dexMapAssetTradeCount[addr])) {
				if (!mapSenderToTotalAssetTradeCount[addr][asset]) {
					mapSenderToTotalAssetTradeCount[addr][asset] = tradeCount;
				} else {
					mapSenderToTotalAssetTradeCount[addr][asset] += tradeCount;
				}
			}
		}

		for (const addr of Object.keys(stableMapAssetTradeCount)) {
			if (!mapSenderToTotalAssetTradeCount[addr]) {
				mapSenderToTotalAssetTradeCount[addr] = {};
			}
			for (const [asset, tradeCount] of Object.entries(stableMapAssetTradeCount[addr])) {
				if (!mapSenderToTotalAssetTradeCount[addr][asset]) {
					mapSenderToTotalAssetTradeCount[addr][asset] = tradeCount;
				} else {
					mapSenderToTotalAssetTradeCount[addr][asset] += tradeCount;
				}
			}
		}

		const mapMostTradedTokens: Record<string, AssetComponents[]> = {};
		const mapAddrToAllTradedTokens: Map<string, string[]> = new Map();

		for (const [addr, mapAssetTradeCount] of Object.entries(mapSenderToTotalAssetTradeCount)) {
			const sortedAssetTradeCount = Object.entries(mapAssetTradeCount).sort(
				([, tradeCountA], [, tradeCountB]) => tradeCountB - tradeCountA,
			);
			for (let i = 0; i < sortedAssetTradeCount.length; i++) {
				const assetTradeCount = sortedAssetTradeCount[i];
				const assetId = assetTradeCount[0];
				if (i < numberOfMostTradedTokenToTake) {
					const asset = Asset.fromString(assetId);
					const assetComponent = {
						currencySymbol: asset.currencySymbol.hex,
						tokenName: asset.tokenName.hex,
					};
					if (!mapMostTradedTokens[addr]) {
						mapMostTradedTokens[addr] = [assetComponent];
					} else {
						mapMostTradedTokens[addr].push(assetComponent);
					}
				}
				const tradedTokens = mapAddrToAllTradedTokens.get(addr);
				if (!tradedTokens) {
					mapAddrToAllTradedTokens.set(addr, [assetId]);
				} else {
					tradedTokens.push(assetId);
				}
			}
		}

		const res: Record<
			string,
			{
				mostTradedTokens: {
					currencySymbol: string;
					tokenName: string;
				}[];
				botConfidencePoint: number;
			}
		> = {};

		const mapUserTokenTradingStrategy = this.aggregateUserTokenTradingStrategy(mapAddrToAllTradedTokens);
		for (const [addr, mostTradedTokens] of Object.entries(mapMostTradedTokens)) {
			if (!mapUserTokenTradingStrategy) {
				res[addr] = {
					mostTradedTokens,
					botConfidencePoint: 0,
				};
				continue;
			}
			res[addr] = {
				mostTradedTokens,
				botConfidencePoint: mapUserTokenTradingStrategy[addr] ?? 0,
			};
		}

		return res;
	}

	private async getTotalAccPrizePool(date: Date): Promise<{
		prizePoolAda: number;
		prizePoolUsd: number;
	}> {
		const adaPrice = await this.findAssetUsdPriceAt(SupportedCoin.ADA, date);
		const { eventStartTime, eventEndTime } = this.config;
		if (date.getTime() < eventStartTime.getTime()) {
			const prizePoolAda = toNumberWithDecimal(BASE_PRIZE_POOL, ADA_DECIMALS);
			const prizePoolUsd = prizePoolAda * adaPrice;
			return {
				prizePoolAda: toNumberWithDecimal(BASE_PRIZE_POOL, ADA_DECIMALS),
				prizePoolUsd: prizePoolUsd,
			};
		}

		let inputDate = date;
		// Event end time represents midnight after the final event day.
		// For post-event calculations, use the actual final event day instead.
		if (date.getTime() >= eventEndTime.getTime()) {
			inputDate = new Date(eventEndTime);
			inputDate.setUTCDate(eventEndTime.getUTCDate() - 1);
		}

		const [feeSwitchPoolPrize, { excludedFeeSwitch, accMonthlyFeeSwitch }] = await Promise.all([
			getFeeSwitchPoolPrizeInMonth(inputDate, this.config.thirdPartyApiUrl),
			this.redisRepository.getMagicFeeSwitchAmount(),
		]);
		const prizePoolFeeSwitch =
			(toNumberWithDecimal(feeSwitchPoolPrize - excludedFeeSwitch + accMonthlyFeeSwitch, ADA_DECIMALS) * 5) / 100; // 5% of accumulate fee switch amount
		const prizePoolAda = toNumberWithDecimal(BASE_PRIZE_POOL, ADA_DECIMALS) + prizePoolFeeSwitch;
		return {
			prizePoolAda: prizePoolAda,
			prizePoolUsd: prizePoolAda * adaPrice,
		};
	}

	// MARK: BOT DETECTION
	/**
	 * Aggregate bot confidence point based on bot-like actions related to tokens strategies (coordination patterns, stablecoin arbitrage focus, single token focus).
	 * @param mapAddrToTradedTokens map address to its traded tokens' id in 'currencySymbol.tokenName' form
	 * @returns map address to bot confidence point aggregated from token trading strategies.
	 */
	private aggregateUserTokenTradingStrategy(mapAddrToTradedTokens: Map<string, string[]>): Record<string, number> {
		const res: Record<string, number> = {};
		const mapTradedTokenSetToAddr = new Map<string, string[]>(); // map from normalized token set -> array of addresses

		for (const [addr, tradedTokens] of mapAddrToTradedTokens) {
			if (!res[addr]) {
				res[addr] = 0;
			}
			if (tradedTokens.length === 1) {
				res[addr] += 2;
			}
			const normalized = tradedTokens.sort();

			let onlyStableTokensTraded: boolean = true;
			for (const token of tradedTokens) {
				if (!STABLE_ASSETS.has(token)) {
					onlyStableTokensTraded = false;
					break;
				}
			}
			if (onlyStableTokensTraded) {
				res[addr] += 2;
			}
			const key = normalized.join(",");
			const addresses = mapTradedTokenSetToAddr.get(key);
			if (!addresses) {
				mapTradedTokenSetToAddr.set(key, [addr]);
			} else {
				addresses.push(addr);
			}
		}

		for (const [_key, addresses] of mapTradedTokenSetToAddr) {
			const groupSize = addresses.length;

			for (const addr of addresses) {
				let point = 0;
				// 2-wallet cluster
				if (groupSize <= 1) {
					continue;
				}
				if (groupSize === 2) {
					point += 1;
					// 4-wallet cluster
				} else if (groupSize <= 4) {
					point += 2;
					// 5+-wallet cluster
				} else {
					point += 3;
				}
				res[addr] += point;
			}
		}

		return res;
	}

	/**
	 * Aggregate bot confidence point based on bot-like trading frequency.
	 * @param mapAddrTradesV1 The map of address to the number of trades on DeX version 1.
	 * @param mapAddrTradesV2 The map of address to the number of trades on DeX version 2.
	 * @param mapAddrTradesStable The map of address to the number of trades on DeX version Stable.
	 * @param totalDays total day in the period in which the trades are counted.
	 * @returns map address to bot confidence point aggregated from trading frequency.
	 */
	private aggregateTradingFrequencyPoint(
		mapAddrTradesV1: Map<string, number>,
		mapAddrTradesV2: Map<string, number>,
		mapAddrTradesStable: Map<string, number>,
		totalDays: number,
	): Record<string, number> {
		const mapAddrToTotalTrades: Map<string, number> = new Map();
		for (const [addr, totalTrades] of mapAddrTradesV1) {
			const userTotalTrades = mapAddrToTotalTrades.get(addr);
			if (!userTotalTrades) {
				mapAddrToTotalTrades.set(addr, totalTrades);
			} else {
				mapAddrToTotalTrades.set(addr, totalTrades + userTotalTrades);
			}
		}

		for (const [addr, totalTrades] of mapAddrTradesV2) {
			const userTotalTrades = mapAddrToTotalTrades.get(addr);
			if (!userTotalTrades) {
				mapAddrToTotalTrades.set(addr, totalTrades);
			} else {
				mapAddrToTotalTrades.set(addr, totalTrades + userTotalTrades);
			}
		}

		for (const [addr, totalTrades] of mapAddrTradesStable) {
			const userTotalTrades = mapAddrToTotalTrades.get(addr);
			if (!userTotalTrades) {
				mapAddrToTotalTrades.set(addr, totalTrades);
			} else {
				mapAddrToTotalTrades.set(addr, totalTrades + userTotalTrades);
			}
		}

		const res: Record<string, number> = {};
		for (const [addr, totalTrade] of mapAddrToTotalTrades) {
			if (!res[addr]) {
				res[addr] = 0;
			}
			const avgTradesCount = totalTrade / totalDays;

			let point = 0;

			if (avgTradesCount <= 5) {
				continue;
			} else if (avgTradesCount <= 15) {
				point = 2;
			} else if (avgTradesCount <= 30) {
				point = 4;
			} else if (avgTradesCount <= 60) {
				point = 6;
			} else if (avgTradesCount <= 100) {
				point = 8;
			} else {
				// For users with avgTradesCount > 100, add 2 points for each full 100 trades above 100.
				// Example: avgTradesCount = 350 => Math.floor(250/100) = 3, so point = 10 + 2*2 = 16
				point = 10 + Math.floor((avgTradesCount - 100) / 100) * 2;
			}
			res[addr] += point;
		}
		return res;
	}

	private getEfficiencySignalPoint(point: number): number {
		if (point <= 5_000) {
		} else if (point <= 7_000) {
			return 1;
		} else if (point <= 10_000) {
			return 2;
		} else {
			return 3;
		}
		return 0;
	}

	private calculateBotConfidenceLevel(botConfidencePoint: number): number {
		if (botConfidencePoint < 8) {
			return 0;
		}
		if (botConfidencePoint < 12) {
			return 1;
		}
		if (botConfidencePoint < 16) {
			return 2;
		}
		return 3;
	}
}

async function pointAggrDataWorker(configs: PointAggrCronConfig): Promise<number | null> {
	if (isJobRunning) {
		console.info("Previous job still running, skipping...");
		return null;
	}
	isJobRunning = true;
	try {
		console.info("Starting pointAggrDataWorker...");
		const start = Date.now();

		const prismaClient = DBClient.getInstance(configs.postgres).prisma;
		const redisClient = RedisClient.getInstance(configs.redis, SERVICE_NAME);
		const eventStartTime = configs.eventStartTime;
		const eventEndTime = configs.eventEndTime;

		const postgresRepository = new PostgresRepository(prismaClient);
		const redisRepository = new RedisRepositoryWriter(redisClient.redis);
		const [assetPrices, mapAssetDetail] = await Promise.all([
			redisRepository.getAllAssetPriceHistory(eventStartTime, eventEndTime),
			redisRepository.getMapAssetDetails(),
		]);
		const cron = new PointAggrCron(postgresRepository, redisRepository, assetPrices, mapAssetDetail, configs);
		await cron.aggregateTradingStats(eventStartTime, eventEndTime, true);
		const end = Date.now();
		const timeTaken = end - start;
		console.info(`Job pointAggrDataWorker finished! Job took ${timeTaken} ms.`);
		return timeTaken;
	} catch (error) {
		console.error("Job failed:", error);
		return null;
	} finally {
		isJobRunning = false;
	}
}

async function runJobWithDynamicInterval(): Promise<void> {
	const abortController = new AbortController();
	const configs = getPointAggrConfig();
	let shuttingDown = false;
	onShutdown(() => {
		shuttingDown = true;
		abortController.abort("shutdown");
	});
	while (true) {
		if (shuttingDown) {
			// break infinity loop when receive shutdown signal
			return;
		}
		try {
			const timeTaken = await pointAggrDataWorker(configs);
			if (timeTaken === null) {
				console.info("Job skipped, waiting 5 seconds...");
				await new Promise((resolve) => setTimeout(resolve, 5000));
				continue;
			}
			const remainingTime = configs.interval - timeTaken;

			if (remainingTime > 0) {
				console.info(`Job completed in ${timeTaken}ms. Waiting ${remainingTime}ms before next run.`);
				await new Promise((resolve) => setTimeout(resolve, remainingTime));
			} else {
				console.info(`Job took ${timeTaken}ms (longer than interval). Running next job immediately.`);
			}
		} catch (error) {
			console.error("Job failed, waiting full interval before retry:", error);
			await new Promise((resolve) => setTimeout(resolve, configs.interval));
		}
	}
}

async function main(): Promise<void> {
	await runJobWithDynamicInterval();
}

void main();
