import { Redis, type RedisOptions } from "ioredis";
import { onShutdown } from "../utils";

export class RedisClient {
	public redis: Redis;
	private static instance: RedisClient;
	private constructor(url: string, connectionName: string, options?: RedisOptions) {
		this.redis = new Redis(url, {
			...options,
			db: 0,
			connectionName,
			enableReadyCheck: true,
			maxRetriesPerRequest: 1,
			showFriendlyErrorStack: false,
		});
	}

	public static getInstance(url: string, connectionName: string, options?: RedisOptions): RedisClient {
		if (!RedisClient.instance) {
			RedisClient.instance = new RedisClient(url, connectionName, options);
		}
		onShutdown(() => RedisClient.instance.redis.disconnect());
		return RedisClient.instance;
	}
}

export class RedisClientReadonly {
	public redis: RedisReadOnly;
	private static instance: RedisClientReadonly;
	private constructor(url: string, connectionName: string, options?: RedisOptions) {
		this.redis = new Redis(url, {
			...options,
			db: 0,
			connectionName,
			enableReadyCheck: true,
			maxRetriesPerRequest: 1,
			showFriendlyErrorStack: false,
			readOnly: true,
		});
	}

	public static getInstance(url: string, connectionName: string, options?: RedisOptions): RedisClientReadonly {
		if (!RedisClientReadonly.instance) {
			RedisClientReadonly.instance = new RedisClientReadonly(url, connectionName, { ...options, readOnly: true });
		}
		onShutdown(() => RedisClientReadonly.instance.redis.disconnect());
		return RedisClientReadonly.instance;
	}
}

export type RedisReadOnly = Pick<
	Redis,
	| "get"
	| "mget"
	| "hget"
	| "hmget"
	| "hgetall"
	| "hlen"
	| "lrange"
	| "zrange"
	| "zrangebyscore"
	| "zrevrangebyscore"
	| "zcount"
	| "on"
	| "disconnect"
	| "quit"
>;
