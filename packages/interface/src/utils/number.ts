export function formatNumber(
	value: number | bigint | string,
	options: Intl.NumberFormatOptions = {
		roundingMode: "trunc",
		maximumFractionDigits: 0,
	},
): string {
	const parsedValue = typeof value === "string" ? safeParseNumber(value) : value;
	const formatter = Intl.NumberFormat("en-US", options);
	return formatter.format(parsedValue);
}

export function safeParseNumber(value: string): number | bigint {
	const parsed = Number(value);

	if (parsed > Number.MAX_SAFE_INTEGER) {
		return BigInt(parsed);
	}

	return parsed;
}
