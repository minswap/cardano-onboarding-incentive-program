import invariant from "@minswap/tiny-invariant";
import JSONBig from "json-bigint";
import { startOfUTCMinute } from "../../utils";
import { type PriceChart, PriceSource, SUPPORTED_COIN_MAP, type SupportedCoin } from "./types";

type BinancePriceResponse = {
	symbol: string;
	price: string;
};

export type BinanceOHLCResponse = [
	number, // Kline open time
	string, // Open price
	string, // High price
	string, // Low price
	string, // Close price
	string, // Volume
	number, // Kline close time
	string, // Quote asset volume
	number, // Number of trades
	string, // Taker buy base asset volume
	string, // Taker buy quote asset volume
	number, // Ignore
][];

export namespace Binance {
	const BASE_URL = "https://api.binance.com/api/v3";

	export async function getCurrentPrice(coin: SupportedCoin, abortSignal?: AbortSignal): Promise<number | null> {
		const coinStr = SUPPORTED_COIN_MAP[coin][PriceSource.BINANCE];
		const url = `${BASE_URL}/ticker/price?symbol=${coinStr}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				signal: abortSignal,
			});

			invariant(response.ok, `Unexpected response: ${response.statusText}`);

			const resultStr = await response.text();
			const res = JSONBig.parse(resultStr) as BinancePriceResponse;
			invariant("price" in res, "missing price");
			const price = Number(res.price);
			invariant(!Number.isNaN(price), `Invalid price`);
			return price;
		} catch (err) {
			console.error("Fail to get price", {
				url: url,
				err: err,
			});
			return null;
		}
	}

	export async function getPriceCharts({
		coin,
		from,
		to,
		interval,
		recordNum = 1000,
		abortSignal,
	}: {
		coin: SupportedCoin;
		from: Date;
		recordNum?: number;
		interval: "1m" | "15m" | "1h";
		to?: Date;
		abortSignal?: AbortSignal;
	}): Promise<PriceChart[] | null> {
		const coinStr = SUPPORTED_COIN_MAP[coin][PriceSource.BINANCE];
		const params = new URLSearchParams({
			symbol: coinStr,
			interval: interval,
			startTime: from.getTime().toString(),
			limit: recordNum.toString(),
		});
		if (to) {
			params.set("endTime", to.getTime().toString());
		}
		const requestUrl = `${BASE_URL}/klines?${params}`;
		try {
			const response = await fetch(requestUrl, {
				method: "GET",
				signal: abortSignal,
			});

			invariant(response.ok, `Unexpected response: ${response.statusText}`);

			const resultStr = await response.text();
			const res = JSONBig.parse(resultStr) as BinanceOHLCResponse;
			if (res.length === 0) {
				return [];
			}
			const priceCharts: PriceChart[] = [];
			for (const record of res) {
				priceCharts.push({
					coin: coin,
					timestamp: new Date(record[0]),
					price: Number(record[1]),
				});
			}
			return priceCharts;
		} catch (err) {
			console.error("Fail to get price charts", {
				url: requestUrl,
				err: err,
			});
			return null;
		}
	}

	export async function getPriceAt(
		coin: SupportedCoin,
		from: Date,
		to?: Date,
		abortSignal?: AbortSignal,
	): Promise<number | null> {
		const formattedDate = startOfUTCMinute(from);
		const priceCharts = await getPriceCharts({
			coin: coin,
			from: formattedDate,
			interval: "1m",
			recordNum: 1,
			to: to,
			abortSignal: abortSignal,
		});
		if (!priceCharts || priceCharts.length === 0) {
			return null;
		}
		return priceCharts[0].price;
	}
}
