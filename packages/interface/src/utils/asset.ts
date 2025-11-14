export function toAssetString(
	currencySymbol: string,
	tokenName: string,
	option: {
		separator: string;
	} = { separator: "" },
): string {
	if (!currencySymbol && !tokenName) {
		return "";
	}
	if (!tokenName) {
		return currencySymbol;
	}
	return `${currencySymbol}${option.separator}${tokenName}`;
}

function hexToText(hex: string): string {
	// Ensure even length
	if (hex.length % 2 !== 0) {
		throw new Error("Invalid hex string length");
	}

	let result = "";
	for (let i = 0; i < hex.length; i += 2) {
		const code = parseInt(hex.substring(i, i + 2), 16);
		result += String.fromCharCode(code);
	}
	return result;
}

export function getDefaultTicker(tokenName: string): string | null {
	try {
		let hex = tokenName;
		if (hex.length > 8 && hex[0] === "0" && hex[7] === "0") {
			hex = hex.substring(8);
		}
		return hexToText(hex);
	} catch {
		return null;
	}
}
