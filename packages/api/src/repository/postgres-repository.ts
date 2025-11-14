import type {
	dex_syncer_trading,
	dex_v2_syncer_trading,
	PrismaClient,
	stableswap_syncer_trading,
} from "@prisma/client";
export class PostgresRepository {
	protected readonly prisma: PrismaClient;
	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * Get a map of sender to their trading times of an asset.
	 * @param an object consists of
	 * from: start time of the period in which the trade is executed
	 * to: end time of the period in which the trade is executed
	 * addresses: the senders' stake address. If stake address is null, take payment address
	 * @returns Map of sender (stake address, if stake address is null, take payment address) -> asset -> trading times
	 */
	async getV1MapAssetTradeCountByAddress(from: Date, to: Date): Promise<Record<string, Record<string, number>>> {
		const result: Record<string, Record<string, number>> = {};
		const data = await this.prisma.$queryRawUnsafe<
			{
				sender_identity: string;
				asset: string;
				trade_count: number;
			}[]
		>(
			`
			WITH dex_order_filtered AS (SELECT created_tx_id, created_tx_index
                               FROM dex_syncer.order
                               WHERE created_at >= $1
                                 AND updated_at <= $2),
     dex_trading_order AS (SELECT t.sender_stake_address, t.created_tx_id, t.sender, t.asset_in, t.asset_out
                              FROM dex_syncer.trading t
                                       JOIN dex_order_filtered o
                                            ON t.created_tx_id = o.created_tx_id
                                                AND t.created_tx_index = o.created_tx_index)
			SELECT sender_identity, asset, SUM(asset_count) AS trade_count
			FROM (SELECT COALESCE(sender_stake_address, sender) AS sender_identity,
						asset_in                               AS asset,
						COUNT(*)                               AS asset_count
				FROM dex_trading_order
				WHERE asset_out = 'lovelace'
				GROUP BY sender_identity, asset_in

				UNION ALL
				SELECT COALESCE(sender_stake_address, sender) AS sender_identity,
						asset_out                              AS asset,
						COUNT(*)                               AS asset_count
				FROM dex_trading_order
				WHERE asset_in = 'lovelace'
				GROUP BY sender_identity, asset_out) AS combined
			GROUP BY sender_identity, asset;
        	`,
			from,
			to,
		);
		data.map((d) => {
			if (!result[d.sender_identity]) {
				result[d.sender_identity] = {};
			}
			result[d.sender_identity][d.asset] = d.trade_count;
		});
		return result;
	}

	/**
	 * Get a map of sender to their trading times of an asset.
	 * @param an object consists of
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * addresses: the senders' stake address. If stake address is null, take payment address
	 * @returns Map of sender (stake address, if stake address is null, take payment address) -> asset -> trading times
	 */
	async getStableMapAssetTradeCountByAddress(from: Date, to: Date): Promise<Record<string, Record<string, number>>> {
		const result: Record<string, Record<string, number>> = {};
		const data = await this.prisma.$queryRawUnsafe<
			{
				sender_identity: string;
				asset: string;
				trade_count: number;
			}[]
		>(
			`
			WITH stableswap_order_filtered AS (SELECT created_tx_id, created_tx_index
                                   FROM stableswap_syncer.order
                                   WHERE created_at >= $1
                                     AND updated_at <= $2),
     stableswap_syncer_trading_order AS (SELECT t.sender_stake_address, t.created_tx_id, t.sender, t.asset_in, t.asset_out
                                  FROM stableswap_syncer.trading t
                                           JOIN stableswap_order_filtered o
                                                ON t.created_tx_id = o.created_tx_id
                                                    AND t.created_tx_index = o.created_tx_index)
			SELECT sender_identity, asset, SUM(asset_count) AS trade_count
			FROM (SELECT COALESCE(sender_stake_address, sender) AS sender_identity,
						asset_in                               AS asset,
						COUNT(*)                               AS asset_count
				FROM stableswap_syncer_trading_order
				GROUP BY sender_identity, asset_in

				UNION ALL
				SELECT COALESCE(sender_stake_address, sender) AS sender_identity,
						asset_out                              AS asset,
						COUNT(*)                               AS asset_count
				FROM stableswap_syncer_trading_order
				GROUP BY sender_identity, asset_out) AS combined
			GROUP BY sender_identity, asset;
        `,
			from,
			to,
		);
		data.map((d) => {
			if (!result[d.sender_identity]) {
				result[d.sender_identity] = {};
			}
			result[d.sender_identity][d.asset] = d.trade_count;
		});
		return result;
	}

	/**
	 * Get Minswap DeX V1 trading events.
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * @param batchSize maximum number of records to take each db connection
	 * @returns DeX V1 trading events.
	 */
	async getV1TradingEvent(
		from: Date,
		to: Date,
		batchSize = 10_000,
	): Promise<(dex_syncer_trading & { created_at: Date })[]> {
		const result: (dex_syncer_trading & { created_at: Date })[] = [];

		let cursor: bigint | undefined;
		let hasMore = true;

		while (hasMore) {
			const data = await this.prisma.$queryRawUnsafe<(dex_syncer_trading & { created_at: Date })[]>(
				`
				SELECT t.*, o.created_at
				FROM dex_syncer.trading t
				JOIN (
					SELECT created_tx_id, created_tx_index, created_at
					FROM dex_syncer.order
					WHERE created_at >= $1 AND updated_at <= $2
				) o ON (t.created_tx_id = o.created_tx_id AND t.created_tx_index = o.created_tx_index)
				WHERE (t.asset_in = 'lovelace' OR t.asset_out = 'lovelace')
				${cursor ? "AND t.id > $3" : ""}
				ORDER BY t.id ASC
				LIMIT $${cursor ? "4" : "3"}
            `,
				from,
				to,
				...(cursor ? [cursor] : []),
				batchSize,
			);

			if (data.length === 0) {
				hasMore = false;
			} else {
				result.push(...data);
				cursor = data[data.length - 1].id;
				if (data.length < batchSize) {
					hasMore = false;
				}
			}
		}

		return result;
	}

	/**
	 * Get Minswap DeX V2 trading events.
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * @param batchSize maximum number of records to take each db connection
	 * @returns DeX V2 trading events.
	 */
	async getV2TradingEvent(
		from: Date,
		to: Date,
		batchSize = 10_000,
	): Promise<(dex_v2_syncer_trading & { created_at: Date })[]> {
		const result: (dex_v2_syncer_trading & { created_at: Date })[] = [];

		let cursor: bigint | undefined;
		let hasMore = true;

		while (hasMore) {
			const data = await this.prisma.$queryRawUnsafe<(dex_v2_syncer_trading & { created_at: Date })[]>(
				`
				WITH filtered_orders AS (
					SELECT created_tx_id, created_tx_index, created_at
					FROM dex_v2_syncer.order
					WHERE created_at >= $1 AND updated_at <= $2
				),
				filtered_trading AS (
					SELECT t.*, o.created_at
					FROM dex_v2_syncer.trading t
					JOIN filtered_orders o ON (t.created_tx_id = o.created_tx_id AND t.created_tx_index = o.created_tx_index)
					WHERE (t.asset_in = 'lovelace' OR t.asset_out = 'lovelace')
					${cursor ? "AND t.id > $3" : ""}
					ORDER BY t.id
				)
				SELECT * FROM filtered_trading
				ORDER BY id
				LIMIT $${cursor ? "4" : "3"}
            	`,
				from,
				to,
				...(cursor ? [cursor] : []),
				batchSize,
			);

			if (data.length === 0) {
				hasMore = false;
			} else {
				result.push(...data);
				cursor = data[data.length - 1].id;
				if (data.length < batchSize) {
					hasMore = false;
				}
			}
		}
		return result;
	}

	/**
	 * Get Minswap Stable trading events.
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * @param batchSize maximum number of records to take each db connection
	 * @returns Stable trading events.
	 */
	async getStableTradingEvent(
		from: Date,
		to: Date,
		batchSize = 1000,
	): Promise<(stableswap_syncer_trading & { created_at: Date })[]> {
		const result: (stableswap_syncer_trading & { created_at: Date })[] = [];

		let cursor: bigint | undefined;
		let hasMore = true;

		while (hasMore) {
			const data = await this.prisma.$queryRawUnsafe<(stableswap_syncer_trading & { created_at: Date })[]>(
				`
            SELECT t.*, created_at
            FROM stableswap_syncer.trading t
                     JOIN (SELECT created_tx_id, created_tx_index, created_at
                           FROM stableswap_syncer.order
                           WHERE created_at >= $1
                             AND updated_at <= $2) o
                          ON t.created_tx_id = o.created_tx_id
                              AND t.created_tx_index = o.created_tx_index
            ${cursor ? "WHERE t.id > $3" : ""}
            ORDER BY t.id ASC
            LIMIT $${cursor ? "4" : "3"}
            `,
				from,
				to,
				...(cursor ? [cursor] : []),
				batchSize,
			);

			if (data.length === 0) {
				hasMore = false;
			} else {
				result.push(...data);
				cursor = data[data.length - 1].id;
				if (data.length < batchSize) {
					hasMore = false;
				}
			}
		}

		return result;
	}

	/**
	 * Retrieves Minswap Stable trading data aggregated by address and date within a specified time period.
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * @returns A Promise that resolves to an object containing:
	 * @returns totalTrades - The total number of stable trades across all addresses in the period
	 * @returns mapAddrTotalTrade - A Record mapping each sender identity to their total number of trades across all dates
	 */
	async getStableTradesByDate(
		from: Date,
		to: Date,
	): Promise<{
		totalTrades: number;
		mapAddrTotalTrade: Map<string, number>; // map address to total number of trades
	}> {
		const data = await this.prisma.$queryRawUnsafe<
			{
				sender_identity: string;
				total_trade: bigint;
			}[]
		>(
			`WITH stableswap_order_filtered AS (SELECT sender_stake_address, sender, created_tx_id, created_tx_index
                                   FROM stableswap_syncer.order
                                   WHERE created_at >= $1
                                     AND updated_at <= $2)
			SELECT COALESCE(sender_stake_address, sender) AS sender_identity,
				COUNT(*)                               AS total_trade
			FROM stableswap_order_filtered
					JOIN (SELECT lp_asset, asset_in, asset_out, created_tx_id, created_tx_index, batched_at
						FROM stableswap_syncer.trading) t ON stableswap_order_filtered.created_tx_id = t.created_tx_id AND
																stableswap_order_filtered.created_tx_index = t.created_tx_index
			GROUP BY sender_identity;`,
			from,
			to,
		);

		const mapAddrTotalTrade: Map<string, number> = new Map();
		let totalTrades: number = 0;
		data.map((d) => {
			const userTotalTrades = Number(d.total_trade);
			mapAddrTotalTrade.set(d.sender_identity, userTotalTrades);
			totalTrades += userTotalTrades;
		});
		return {
			totalTrades: totalTrades,
			mapAddrTotalTrade: mapAddrTotalTrade,
		};
	}

	/**
	 * Retrieves Minswap V2 trading data aggregated by address and date within a specified time period.
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * @returns A Promise that resolves to an object containing:
	 * @returns totalTrades - The total number of V2 trades across all addresses in the period
	 * @returns mapAddrTotalTrade - A Record mapping each sender identity to their total number of trades across all dates
	 */
	async getDexV2TradesByDate(
		from: Date,
		to: Date,
	): Promise<{
		totalTrades: number;
		mapAddrTotalTrade: Map<string, number>; // map address to total number of trades
	}> {
		const data = await this.prisma.$queryRawUnsafe<
			{
				sender_identity: string;
				total_trade: bigint;
			}[]
		>(
			`
				WITH dex_v2_order_filtered AS (
								SELECT sender_stake_address,
                                      success_receiver,
                                      created_tx_id,
                                      created_tx_index,
                                      updated_at
                               FROM dex_v2_syncer.order
                               WHERE created_at >= $1
                                 AND updated_at <= $2),
					dex_v2_trading AS (SELECT created_tx_id, created_tx_index
										FROM dex_v2_syncer.trading
										WHERE asset_in = 'lovelace'
										OR asset_out = 'lovelace')
				SELECT COALESCE(sender_stake_address, success_receiver) AS sender_identity,
					COUNT(*)                                         AS total_trade
				FROM dex_v2_order_filtered o
						JOIN dex_v2_trading t ON o.created_tx_id = t.created_tx_id AND
												o.created_tx_index = t.created_tx_index
				GROUP BY sender_identity;
			`,
			from,
			to,
		);
		const mapAddrTotalTrade: Map<string, number> = new Map();
		let totalTrades: number = 0;
		data.map((d) => {
			const userTotalTrades = Number(d.total_trade);
			mapAddrTotalTrade.set(d.sender_identity, userTotalTrades);
			totalTrades += userTotalTrades;
		});
		return {
			totalTrades: totalTrades,
			mapAddrTotalTrade: mapAddrTotalTrade,
		};
	}

	/**
	 * Retrieves Minswap V1 trading data aggregated by address and date within a specified time period.
	 * @param from: start time of the period in which the trade is executed
	 * @param to: end time of the period in which the trade is executed
	 * @returns A Promise that resolves to an object containing:
	 * @returns totalTrades - The total number of V1 trades across all addresses in the period
	 * @returns mapAddrTotalTrade - A Record mapping each sender identity to their total number of trades across all dates
	 */
	async getDexV1TradesDate(
		from: Date,
		to: Date,
	): Promise<{
		totalTrades: number;
		mapAddrTotalTrade: Map<string, number>; // map address to total number of trades
	}> {
		const data = await this.prisma.$queryRawUnsafe<
			{
				sender_identity: string;
				total_trade: bigint;
			}[]
		>(
			`WITH dex_order_filtered AS (SELECT sender_stake_address, sender, created_tx_id, created_tx_index
                            FROM dex_syncer.order
                            WHERE created_at >= $1
                              AND updated_at <= $2)
			SELECT COALESCE(sender_stake_address, sender) AS sender_identity,
				COUNT(*)                               AS total_trade
			FROM dex_order_filtered
					JOIN (SELECT lp_asset, asset_in, asset_out, created_tx_id, created_tx_index, batched_at
						FROM dex_syncer.trading) t ON dex_order_filtered.created_tx_id = t.created_tx_id AND
														dex_order_filtered.created_tx_index = t.created_tx_index
			WHERE t.asset_in = 'lovelace'
			OR t.asset_out = 'lovelace'
			GROUP BY sender_identity;`,
			from,
			to,
		);

		const mapAddrTotalTrade: Map<string, number> = new Map();
		let totalTrades: number = 0;
		data.map((d) => {
			const userTotalTrades = Number(d.total_trade);
			mapAddrTotalTrade.set(d.sender_identity, userTotalTrades);
			totalTrades += userTotalTrades;
		});
		return {
			totalTrades: totalTrades,
			mapAddrTotalTrade: mapAddrTotalTrade,
		};
	}
}
