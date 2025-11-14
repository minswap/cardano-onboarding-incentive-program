import { EnvKey, getEnv } from "../../utils";

export type PointAggrCronConfig = {
	postgres: string;
	redis: string;
	thirdPartyApiUrl: string;
	eventStartTime: Date;
	eventEndTime: Date;
	interval: number; // interval in milliseconds
};

export function getPointAggrConfig(): PointAggrCronConfig {
	const postgres = getEnv(EnvKey.POSTGRES);
	const redis = getEnv(EnvKey.REDIS);
	const startRaw = getEnv(EnvKey.EVENT_START_TIME);
	const endRaw = getEnv(EnvKey.EVENT_END_TIME);
	const minswapThirdPartyUrl = getEnv(EnvKey.MINSWAP_THIRD_PARTY_API);
	const interval = Number(getEnv(EnvKey.INTERVAL)) * 1000;

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

	return { postgres, redis, eventStartTime, eventEndTime, thirdPartyApiUrl: minswapThirdPartyUrl, interval };
}
