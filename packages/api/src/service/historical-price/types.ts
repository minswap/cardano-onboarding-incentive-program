export enum SupportedCoin {
	ADA = "ada",
	BTC = "btc",
	ETH = "eth",
	SOL = "sol",
}

export enum PriceSource {
	BINANCE = "binance",
}

export type PriceChart = {
	coin: SupportedCoin;
	price: number;
	timestamp: Date;
};

export const SUPPORTED_COIN_MAP: Record<SupportedCoin, Record<PriceSource, string>> = {
	[SupportedCoin.ADA]: {
		[PriceSource.BINANCE]: "ADAUSDT",
	},
	[SupportedCoin.BTC]: {
		[PriceSource.BINANCE]: "BTCUSDT",
	},
	[SupportedCoin.ETH]: {
		[PriceSource.BINANCE]: "ETHUSDT",
	},
	[SupportedCoin.SOL]: {
		[PriceSource.BINANCE]: "SOLUSDT",
	},
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
