import fastifyCors, { type OriginFunction } from "@fastify/cors";
import FastifyRateLimit from "@fastify/rate-limit";
import fastify from "fastify";
import { RedisClient, RedisClientReadonly } from "../database/redis";
import { extractAddressIdent } from "../ledger/address";
import { RedisRepositoryReader } from "../repository/redis-repository";
import type { TradingRankFilter } from "../repository/types";
import { TradingPointService } from "../service/trading-point-service";
import { getRealClientIP } from "../utils";
import { getPointServiceConfig } from "./configs";

const ENDPOINTS = {
	HEALTH: "/health",
	SERVER_TIME: "/server-time",
	EVENT_STATS: "/event-stats",
	RANK: "/rank",
	RANK_BY_ADDRESS: "/rank/address",
};

const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

const SERVICE_NAME = "trading-point-api";

async function main(): Promise<void> {
	const configs = getPointServiceConfig();
	const rateLimitRedis = RedisClient.getInstance(configs.apiRedis, SERVICE_NAME, {
		connectTimeout: 500,
		maxRetriesPerRequest: 1,
	});
	const redisReadOnly = RedisClientReadonly.getInstance(configs.redis, SERVICE_NAME);

	const redisRepository = new RedisRepositoryReader(redisReadOnly.redis);
	const tradingPointService = new TradingPointService(redisRepository);
	const app = fastify({
		trustProxy: true,
	});
	await app.register(FastifyRateLimit, {
		max: 1000,
		timeWindow: "1 minute",
		redis: rateLimitRedis.redis,
		nameSpace: "trading-point-api-rate-limit:",
		keyGenerator: (req) => getRealClientIP(req).replaceAll(":", "."),
		allowList(req) {
			if (req.url === "/health") {
				return true;
			}
			return false;
		},
	});

	app.get(ENDPOINTS.HEALTH, () => "healthy");

	app.get(ENDPOINTS.EVENT_STATS, async (_, res) => {
		const eventStats = await tradingPointService.getEventStats();
		return res.send(eventStats);
	});

	app.get(ENDPOINTS.RANK, async (req, res) => {
		const param = req.query as { limit?: number; filter?: string };
		if (param.limit && param.limit > 1000) {
			res.statusCode = BAD_REQUEST;
			throw new Error("Too many records requested.");
		}

		if (param.filter && param.filter !== "bot" && param.filter !== "human") {
			res.statusCode = BAD_REQUEST;
			throw new Error("Wrong type of filter.");
		}
		const filter = param.filter ? (param.filter as TradingRankFilter) : undefined;
		const result = await tradingPointService.getTopUserTradingStats(param.limit, filter);
		return res.send(result);
	});

	app.get(ENDPOINTS.RANK_BY_ADDRESS, async (req, res) => {
		// stake1...
		const query = req.query as { address: string };
		const addr = query.address?.trim();

		if (!addr) {
			res.statusCode = BAD_REQUEST;
			throw new Error("Missing address parameter.");
		}
		let addrIdent: string;
		try {
			addrIdent = extractAddressIdent(addr).bech32;
		} catch {
			res.statusCode = BAD_REQUEST;
			throw new Error("Invalid address format.");
		}
		const rank = await tradingPointService.getUserTradingStatsByAddress(addrIdent);
		return res.send(rank);
	});

	app.get(ENDPOINTS.SERVER_TIME, async (_, res) => {
		const time = await tradingPointService.getServerTime();
		return res.send(time);
	});

	app.setErrorHandler(async (error, _, reply) => {
		if (reply.statusCode === INTERNAL_SERVER_ERROR) {
			await reply.send({ error: "Internal server error." });
		}

		await reply.send(error);
	});

	const originHandler: OriginFunction = (origin: string | undefined, callback) => {
		const isAllow =
			!origin || // allow bots and crawler, i.e. DefiYield
			origin === "https://minswap.org" ||
			origin === "https://app.minswap.org" ||
			origin === "https://eternl-dapp-browser.minswap.org" || // private URL for Eternl Dapp browser
			origin === "https://staging.minswap.org" ||
			origin === "https://monorepo-mainnet-staging.minswap.org" ||
			origin === "https://mcdo-incentive-program-interface.vercel.app" ||
			origin.startsWith("http://localhost") || // dev environment
			/https:\/\/[\w-]+-minswap\.vercel\.app/.test(origin); // vercel preview environment
		callback(null, isAllow);
	};

	await app.register(fastifyCors, {
		origin: originHandler,
	});

	await app.listen({
		host: "0.0.0.0",
		port: configs.apiPort,
	});
	console.info(`🚀 Server ready at http://localhost:${configs.apiPort}`);
}

void main();
