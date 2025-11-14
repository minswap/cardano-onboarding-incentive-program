import { backOff } from "exponential-backoff";
import { sleep, tryParseBigInt } from "../../utils";
import { MAP_ASSET_TO_MULTIPLIER } from "./constants";

export type AssetData = {
	metadata: {
		isVerified: boolean;
		decimals: number;
		name?: string;
		ticker?: string;
	};
	marketDetails: {
		marketCap: number;
		volume24h: number;
		price: number;
		priceChange24h: number;
	};
};

export async function getFeeSwitchPoolPrizeInMonth(
	date: Date,
	thirdPartyApiUrl: string,
	maxRetries = 5,
): Promise<bigint> {
	return await backOff(
		async () => {
			await sleep(20_000); // wait 20s to avoid rate limit

			console.log(`Fetching fee switch data for ${date.toISOString()}`);

			const response = await fetch(`${thirdPartyApiUrl}/total-fee-switch?date=${date.toISOString()}`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error(`getFeeSwitchPoolPrizeInMonth: ${response.status} ${response.statusText}`);
			}

			const feeSwitchPoolPrize = await response.text();
			return tryParseBigInt(feeSwitchPoolPrize) ?? 0n;
		},
		{
			numOfAttempts: maxRetries,
			startingDelay: 5000,
			timeMultiple: 1,
			maxDelay: 20000,
			retry: (error: Error, attemptNumber: number) => {
				console.error(`API request failed, attempt ${attemptNumber}/${maxRetries}:`, error.message);
				return true;
			},
		},
	);
}

export async function getMapAssetMetadata(
	assetIds: string[],
	thirdPartyApiUrl: string,
): Promise<Record<string, AssetData>> {
	const response = await fetch(`${thirdPartyApiUrl}/asset-data`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			assetIds: assetIds,
		}),
	});
	if (!response.ok) {
		throw new Error(`getAssetMetadata: Unexpected response ${response.statusText}`);
	}
	const res = (await response.json()) as Record<string, AssetData>;
	return res;
}

/**
 * @param value : K
 * @param arr : T[] (arr must be sorted ascending(array not must be unique))
 * @param comparator compare arr[i] with value
 * if arr[i] > value return positive numbers
 * if arr[i] < value return negative numbers
 * if arr[i] === value return 0
 * @returns the first index having element greater than value, if not return null
 */
export function findUpperBound<T, K>(arr: T[], value: K, comparator: (arg0: T, arg1: K) => number): number | null {
	let leftPointer = 0;
	let rightPointer = arr.length - 1;
	// value higher than all
	if (arr.length === 0 || comparator(arr[rightPointer], value) <= 0) {
		return null;
	}
	while (leftPointer <= rightPointer) {
		const midPointer = Math.floor((leftPointer + rightPointer) / 2);
		const compare = comparator(arr[midPointer], value);
		if (compare <= 0) {
			leftPointer = midPointer + 1;
		} else if (compare > 0) {
			rightPointer = midPointer - 1;
		}
	}
	return leftPointer;
}

/**
 * Get the point multiplier for an asset.
 * @param asset in format "currencySymbol.tokenName"
 * @returns a number indicates the multiplier.
 */
export function getAssetMultiplier(assetId: string): number {
	return MAP_ASSET_TO_MULTIPLIER[assetId] ?? 1;
}
