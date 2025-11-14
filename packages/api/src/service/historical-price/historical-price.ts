import type { RedisRepositoryWriter } from "../../repository/redis-repository";
import { sleep, startOfUTCMinute } from "../../utils";
import { Binance } from "./binance";
import { type PriceChart, SupportedCoin } from "./types";

export class HistoricalPriceService {
	private readonly redisRepository: RedisRepositoryWriter;
	private readonly shutdownController: AbortController;
	private readonly defaultStartSnapShotDate;
	private readonly defaultEndSnapShotDate;

	constructor({
		redisRepository,
		defaultEndSnapShotDate,
		defaultStartSnapShotDate,
	}: {
		redisRepository: RedisRepositoryWriter;
		defaultStartSnapShotDate: Date;
		defaultEndSnapShotDate: Date;
	}) {
		this.redisRepository = redisRepository;
		this.shutdownController = new AbortController();
		this.defaultStartSnapShotDate = defaultStartSnapShotDate;
		this.defaultEndSnapShotDate = defaultEndSnapShotDate;
	}

	async getPriceAt(coin: SupportedCoin, date: Date, abortSignal?: AbortSignal): Promise<number | null> {
		const formattedDate = startOfUTCMinute(date);

		const cachedPrice = await this.redisRepository.getAssetPriceAt(coin, formattedDate);
		if (cachedPrice !== null) {
			return cachedPrice;
		}

		const priceCharts = await Binance.getPriceCharts({
			coin: coin,
			from: formattedDate,
			interval: "1m",
			recordNum: 1,
			abortSignal: abortSignal,
		});

		if (!priceCharts || priceCharts.length === 0) {
			return null;
		}

		const price = priceCharts[0].price;
		await this.redisRepository.setAssetPrice(coin, price, formattedDate);
		return price;
	}

	async getLatestPrice(coin: SupportedCoin): Promise<number | null> {
		return await this.redisRepository.getLatestAssetPrice(coin);
	}

	async getPriceHistory(
		coin: SupportedCoin,
		fromDate: Date,
		toDate: Date,
		limit: number = 1000,
	): Promise<{ price: number; timestamp: Date }[]> {
		return await this.redisRepository.getAssetPriceHistory(coin, fromDate, toDate, limit);
	}

	async fetchAndCachePriceData(
		coin: SupportedCoin,
		from: Date,
		interval: "1m" | "15m" | "1h" = "1m",
		to?: Date,
		abortSignal?: AbortSignal,
	): Promise<PriceChart[]> {
		const priceCharts = await Binance.getPriceCharts({
			coin: coin,
			from: from,
			interval: interval,
			recordNum: 1000,
			to: to,
			abortSignal: abortSignal,
		});

		if (!priceCharts || priceCharts.length === 0) {
			return [];
		}

		const pricesToSave = priceCharts.map((chart) => ({
			coin,
			price: chart.price,
			timestamp: chart.timestamp,
		}));

		return pricesToSave;
	}

	async start(coin: SupportedCoin): Promise<void> {
		const latestTimestamps = await this.redisRepository.getLatestAssetTimestamps();
		const startDate: Date = latestTimestamps[coin] ?? this.defaultStartSnapShotDate;
		let currentDate = new Date(startDate);
		let hasReachedEndDate = false;

		while (!hasReachedEndDate && startDate <= this.defaultEndSnapShotDate) {
			if (this.shutdownController.signal.aborted) {
				console.warn("Receive abort signal, exiting the loop");
				break;
			}

			const prices = await this.fetchAndCachePriceData(coin, currentDate, "1m", this.defaultEndSnapShotDate);

			if (prices.length === 0) {
				console.info(`No price data found for ${coin}, sleeping 15s...`);
				await sleep(15000); // 15s
				continue;
			}

			const newPrices: PriceChart[] = [];
			if (prices[prices.length - 1].timestamp >= this.defaultEndSnapShotDate) {
				hasReachedEndDate = true;
			}

			for (const price of prices) {
				if (price.timestamp <= startDate) {
					continue;
				}
				newPrices.push(price);
			}

			if (newPrices.length === 0) {
				console.info(`No new price data for ${coin}, sleeping 15s...`);
				await sleep(15000); // 15s
				continue;
			}
			await this.redisRepository.setAssetPrices(newPrices);
			currentDate = new Date(prices[prices.length - 1].timestamp.getTime() + 60000);

			console.log(`Processed ${newPrices.length} price records for ${coin}, next start: ${currentDate.toISOString()}`);
		}

		console.log(`Finished processing ${coin} up to ${this.defaultEndSnapShotDate.toISOString()}`);
	}

	async fetchAll(): Promise<void> {
		console.info("Running historicalPriceService...");
		await Promise.allSettled([
			this.start(SupportedCoin.ETH),
			this.start(SupportedCoin.BTC),
			this.start(SupportedCoin.ADA),
			this.start(SupportedCoin.SOL),
		]);
	}
}
