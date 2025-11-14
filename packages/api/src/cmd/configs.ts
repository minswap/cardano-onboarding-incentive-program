import { EnvKey, getEnv } from "../utils";

export type PointServiceConfig = {
	redis: string;
	apiRedis: string;
	apiPort: number;
};

export function getPointServiceConfig(): PointServiceConfig {
	const config: PointServiceConfig = {
		redis: getEnv(EnvKey.REDIS),
		apiRedis: getEnv(EnvKey.API_REDIS),
		apiPort: Number(getEnv(EnvKey.API_PORT)),
	};
	return config;
}
