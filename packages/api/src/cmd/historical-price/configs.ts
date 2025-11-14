import { EnvKey, getEnv } from "../../utils";

export type HistoricalPriceServiceConfig = {
	redis: string;
	eventStartTime: Date;
	eventEndTime: Date;
};

export function getHistoricalPriceServiceConfigs(): HistoricalPriceServiceConfig {
	const redis = getEnv(EnvKey.REDIS);
	const startRaw = getEnv(EnvKey.EVENT_START_TIME);
	const endRaw = getEnv(EnvKey.EVENT_END_TIME);

	const eventStartTime = new Date(startRaw);
	const eventEndTime = new Date(endRaw);

	if (Number.isNaN(eventStartTime.getTime())) {
		throw new Error(
			`Invalid EVENT_START_TIME value: "${startRaw}". Use an ISO 8601 UTC string, e.g. 2025-08-20T00:00:00Z`,
		);
	}
	if (Number.isNaN(eventEndTime.getTime())) {
		throw new Error(`Invalid EVENT_END_TIME value: "${endRaw}". Use an ISO 8601 UTC string, e.g. 2025-08-21T00:00:00Z`);
	}
	if (eventStartTime > eventEndTime) {
		throw new Error("EVENT_START_TIME must be before or equal to EVENT_END_TIME");
	}

	return { redis, eventStartTime, eventEndTime };
}
