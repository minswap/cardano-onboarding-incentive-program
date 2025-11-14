import invariant from "@minswap/tiny-invariant";
import { Bytes } from "./bytes";

export class Asset {
	readonly currencySymbol: Bytes;
	readonly tokenName: Bytes;

	constructor(currencySymbol: Bytes, tokenName: Bytes) {
		if (currencySymbol.length > 0 || tokenName.length > 0) {
			invariant(currencySymbol.length === 28, `expect CurrencySymbol has length 28, got: ${currencySymbol.hex}`);
			invariant(
				tokenName.length >= 0 && tokenName.length <= 32,
				`expect TokenName has length from 0 to 32, got: ${tokenName.hex}`,
			);
		}
		this.currencySymbol = currencySymbol.clone();
		this.tokenName = tokenName.clone();
	}

	static fromString(s: string): Asset {
		if (s === "lovelace") {
			return ADA;
		}
		const parts = s.split(".");
		invariant(
			parts.length === 1 || parts.length === 2,
			"Asset.fromString: expect input to have format lovelace, $policyID or $policyID.$assetName",
		);
		return new Asset(Bytes.fromHex(parts[0]), Bytes.fromHex(parts[1] ?? ""));
	}
}

export function assetToString(currencySymbol: string, tokenName?: string): string {
	return tokenName ? `${currencySymbol}.${tokenName}` : currencySymbol;
}

export const ADA = new Asset(Bytes.fromHex(""), Bytes.fromHex(""));
export const ADA_DECIMALS = 6;
