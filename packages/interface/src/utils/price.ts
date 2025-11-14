import { formatNumber } from "./number";

export type PriceChangeDirection = {
	isNotChange: boolean;
	isNearlyNotChange: boolean;
	isIncreasing: boolean;
	isDecreasing: boolean;
};

export function getPriceChangeDirection(priceChange: number): PriceChangeDirection {
	return {
		isNotChange: priceChange === 0,
		isNearlyNotChange: priceChange < 0.01 && priceChange > -0.01 && priceChange !== 0,
		isIncreasing: priceChange >= 0.01,
		isDecreasing: priceChange <= -0.01,
	};
}

export function getPriceChangeClass(priceChange: number) {
	const { isNotChange, isIncreasing, isDecreasing, isNearlyNotChange } = getPriceChangeDirection(priceChange);

	return {
		"text-base-sc": isIncreasing,
		"text-base-dg": isDecreasing,
		"text-itr-tent-pri-sub": isNotChange || isNearlyNotChange,
	};
}

export function getPriceChangeText(priceChange: number) {
	const { isNotChange, isNearlyNotChange } = getPriceChangeDirection(priceChange);

	if (isNotChange) {
		return "0%";
	}
	if (isNearlyNotChange) {
		return "≈0%";
	}
	return `${formatNumber(Math.abs(priceChange), {
		maximumFractionDigits: 2,
		...(priceChange < 0 ? { roundingMode: "floor" } : {}),
	})}%`;
}
