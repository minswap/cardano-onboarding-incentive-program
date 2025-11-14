import { backOff } from "exponential-backoff";
import { RedisClient } from "../../database/redis";
import { RedisRepositoryWriter } from "../../repository/redis-repository";
import { HistoricalPriceService } from "../../service/historical-price/historical-price";
import { getHistoricalPriceServiceConfigs } from "./configs";

const SERVICE_NAME = "historical-price";

async function main(): Promise<void> {
	return backOff(
		async () => {
			const configs = getHistoricalPriceServiceConfigs();
			const redisClient = RedisClient.getInstance(configs.redis, SERVICE_NAME);
			const redisRepository = new RedisRepositoryWriter(redisClient.redis);
			const historicalPriceService = new HistoricalPriceService({
				redisRepository: redisRepository,
				defaultStartSnapShotDate: configs.eventStartTime,
				defaultEndSnapShotDate: configs.eventEndTime,
			});
			try {
				await historicalPriceService.fetchAll();
			} catch (err) {
				redisClient.redis.disconnect();
				throw err;
			}
		},
		{
			retry(err, attempt): boolean {
				console.error(`Fail to run historical ada price, retry ${attempt}...`, err);
				return true;
			},
			startingDelay: 500,
		},
	);
}

void main();
