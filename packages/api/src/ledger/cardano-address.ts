import * as Typhon from "@stricahq/typhonjs";
import { Bytes } from "./bytes";
import { decodeBech32, encodeBech32 } from "./utils";

const B32_PREFIX = "addr";
const STAKE_PREFIX = "stake";
const HASH_28_SIZE = 28;

export enum CredentialType {
	PUB_KEY_CREDENTIAL = 0,
	SCRIPT_CREDENTIAL = 1,
}

export type Credential = {
	type: CredentialType;
	payload: Bytes;
};

export enum AddressType {
	BASE_ADDRESS = "BASE_ADDRESS",
	ENTERPRISE_ADDRESS = "ENTERPRISE_ADDRESS",
	POINTER_ADDRESS = "POINTER_ADDRESS",
	REWARD_ADDRESS = "REWARD_ADDRESS",
	LEGACY_ADDRESS = "LEGACY_ADDRESS",
}

export type StakePoint = {
	slot: number;
	txIndex: number;
	certIndex: number;
};

export type CardanoBaseAddress = {
	type: AddressType.BASE_ADDRESS;
	payment: Credential;
	stake: Credential;
};

export type CardanoEnterpriseAddress = {
	type: AddressType.ENTERPRISE_ADDRESS;
	payment: Credential;
};

export type CardanoPointerAddress = {
	type: AddressType.POINTER_ADDRESS;
	payment: Credential;
	stake: StakePoint;
};

export type CardanoRewardAddress = {
	type: AddressType.REWARD_ADDRESS;
	stake: Credential;
};

export type CardanoLegacyAddress = {
	type: AddressType.LEGACY_ADDRESS;
	base58: string;
};

export type CardanoEvolutionAddress =
	| CardanoBaseAddress
	| CardanoEnterpriseAddress
	| CardanoPointerAddress
	| CardanoRewardAddress;

export type CardanoAddress = CardanoEvolutionAddress | CardanoLegacyAddress;

export namespace CardanoAddress {
	export function variableNatDecode(bytes: Uint8Array): [number, number] | Error {
		let output = 0;
		let bytesRead = 0;

		for (const b of bytes) {
			output = (output << 7) | (b & 0x7f);
			bytesRead += 1;
			if ((b & 0x80) === 0) {
				return [output, bytesRead];
			}
		}

		return new Error("variableNatDecode failed");
	}

	export function variableNatEncode(_n: number): Uint8Array {
		const o: number[] = [_n & 0x7f];
		let x = Math.floor(_n / 128);
		while (x > 0) {
			o.push((x & 0x7f) | 0x80);
			x = Math.floor(x / 128);
		}
		for (let i = 0, j = o.length - 1; i < j; i++, j--) {
			[o[i], o[j]] = [o[j], o[i]];
		}
		return new Uint8Array(o);
	}

	export function decodeCardanoAddress(raw: string): CardanoAddress {
		let rbytes: Uint8Array;

		if (raw.startsWith(B32_PREFIX) || raw.startsWith(STAKE_PREFIX)) {
			const result = decodeBech32(raw);
			rbytes = Uint8Array.from(result.data);
			return decodeRawCardanoAddress(rbytes);
		} else {
			return decodeRawLegacyAddress(raw);
		}
	}

	export function readAddressCredential(s: Uint8Array, header: number, bit: number, pos: number): Credential {
		const hashBytes = s.slice(pos, pos + HASH_28_SIZE);
		if ((header & (1 << bit)) === 0) {
			return {
				type: CredentialType.PUB_KEY_CREDENTIAL,
				payload: new Bytes(hashBytes),
			};
		}
		return {
			type: CredentialType.SCRIPT_CREDENTIAL,
			payload: new Bytes(hashBytes),
		};
	}

	export function decodeRawCardanoAddress(s: Uint8Array): CardanoAddress {
		if (s.length === 0) {
			throw new Error("empty address");
		}

		const header = s[0];
		switch ((header & 0xf0) >> 4) {
			// Base type
			case 0b0000:
			case 0b0001:
			case 0b0010:
			case 0b0011: {
				// header + keyhash
				if (s.length !== 57) {
					throw new Error("Invalid length for base address");
				}
				return {
					type: AddressType.BASE_ADDRESS,
					payment: readAddressCredential(s, header, 4, 1),
					stake: readAddressCredential(s, header, 5, HASH_28_SIZE + 1),
				};
			}
			// Pointer type
			case 0b0100:
			case 0b0101: {
				// header + keyhash + 3 natural numbers (min 1 byte each)
				if (s.length < 32) {
					throw new Error("Invalid length for pointer address");
				}
				let byteIndex = 1;
				byteIndex += HASH_28_SIZE;
				const paymentCred = readAddressCredential(s, header, 4, 1);
				const slotResult = variableNatDecode(s.slice(byteIndex));
				if (slotResult instanceof Error) {
					throw new Error("slot variable decode failed");
				}
				const [slot, slotBytes] = slotResult;
				byteIndex += slotBytes;

				const txIndexResult = variableNatDecode(s.slice(byteIndex));
				if (txIndexResult instanceof Error) {
					throw new Error("txIndex variable decode failed");
				}
				const [txIndex, txBytes] = txIndexResult;
				byteIndex += txBytes;

				const certIndexResult = variableNatDecode(s.slice(byteIndex));
				if (certIndexResult instanceof Error) {
					throw new Error("certIndex variable decode failed");
				}
				const [certIndex, certBytes] = certIndexResult;
				byteIndex += certBytes;

				if (byteIndex > s.length) {
					throw new Error("byte index is out of range of pointer length");
				}

				return {
					type: AddressType.POINTER_ADDRESS,
					payment: paymentCred,
					stake: {
						slot: slot,
						txIndex: txIndex,
						certIndex: certIndex,
					},
				};
			}
			// Enterprise type
			case 0b0110:
			case 0b0111: {
				// header + keyhash
				if (s.length !== 29) {
					throw new Error("Invalid length for enterprise address");
				}
				return {
					type: AddressType.ENTERPRISE_ADDRESS,
					payment: readAddressCredential(s, header, 4, 1),
				};
			}
			// Reward type
			case 0b1110:
			case 0b1111: {
				if (s.length !== 29) {
					throw new Error("Invalid length for reward address");
				}
				return {
					type: AddressType.REWARD_ADDRESS,
					stake: readAddressCredential(s, header, 4, 1),
				};
			}
			// Legacy byron type
			case 0b1000: {
				return decodeRawLegacyAddress(Buffer.from(s).toString("hex"));
			}
		}

		throw new Error("Unsupported address type");
	}

	export function getCardanoAddressPrefix(addr: CardanoEvolutionAddress): string {
		switch (addr.type) {
			case AddressType.BASE_ADDRESS: {
				return B32_PREFIX;
			}
			case AddressType.ENTERPRISE_ADDRESS: {
				return B32_PREFIX;
			}
			case AddressType.REWARD_ADDRESS: {
				return STAKE_PREFIX;
			}
			case AddressType.POINTER_ADDRESS: {
				return B32_PREFIX;
			}
		}
	}

	export function getCardanoAddressBytes(addr: CardanoEvolutionAddress): Bytes {
		switch (addr.type) {
			case AddressType.BASE_ADDRESS: {
				const buf = new Uint8Array(57);
				buf[0] = (addr.payment.type << 4) | (addr.stake.type << 5) | (1 & 0xf);
				buf.set(addr.payment.payload.bytes, 1);
				buf.set(addr.stake.payload.bytes, 29);
				return new Bytes(buf);
			}
			case AddressType.ENTERPRISE_ADDRESS: {
				const buf = new Uint8Array(29);
				buf[0] = 0b0110_0000 | ((addr.payment.type << 4) & 0xf0) | (1 & 0xf);
				buf.set(addr.payment.payload.bytes, 1);
				return new Bytes(buf);
			}
			case AddressType.REWARD_ADDRESS: {
				const buf = new Uint8Array(29);
				buf[0] = 0b1110_0000 | (addr.stake.type << 4) | (1 & 0xf);
				buf.set(addr.stake.payload.bytes, 1);
				return new Bytes(buf);
			}
			case AddressType.POINTER_ADDRESS: {
				const bytes = new Uint8Array([
					0b0100_0000 | (addr.payment.type << 4) | (1 & 0xf),
					...addr.payment.payload.bytes,
					...variableNatEncode(addr.stake.slot),
					...variableNatEncode(addr.stake.txIndex),
					...variableNatEncode(addr.stake.certIndex),
				]);
				return new Bytes(bytes);
			}
		}
	}

	export function toBech32(addr: CardanoAddress): string {
		if (!validateCardanoAddress(addr)) {
			throw new Error("could not parse CardanoAddrress");
		}
		switch (addr.type) {
			case AddressType.LEGACY_ADDRESS: {
				return addr.base58;
			}
			case AddressType.BASE_ADDRESS:
			case AddressType.ENTERPRISE_ADDRESS:
			case AddressType.POINTER_ADDRESS:
			case AddressType.REWARD_ADDRESS: {
				return encodeBech32(getCardanoAddressPrefix(addr), getCardanoAddressBytes(addr).bytes);
			}
		}
	}

	export function decodeRawLegacyAddress(raw: string): CardanoLegacyAddress {
		const byronAddress = Typhon.utils.getAddressFromString(raw);
		/**
		 * Reference: https://github.com/cardano-foundation/CIPs/tree/master/CIP-0003#master-key-generation
		 * Mainnet Byron Addresses: Typically start with prefixes such as Ae2 or Ddz.
		 */
		const legacyAddr: CardanoLegacyAddress = {
			type: AddressType.LEGACY_ADDRESS,
			base58: byronAddress.getBech32(),
		};
		return legacyAddr;
	}

	export function validateCardanoAddress(address: CardanoAddress): boolean {
		switch (address.type) {
			case AddressType.BASE_ADDRESS: {
				return address.payment.payload.length === HASH_28_SIZE && address.stake.payload.length === HASH_28_SIZE;
			}
			case AddressType.ENTERPRISE_ADDRESS: {
				return address.payment.payload.length === HASH_28_SIZE;
			}
			case AddressType.POINTER_ADDRESS: {
				return address.payment.payload.length === HASH_28_SIZE;
			}
			case AddressType.REWARD_ADDRESS: {
				return address.stake.payload.length === HASH_28_SIZE;
			}
			case AddressType.LEGACY_ADDRESS: {
				// Deprecated type
				return true;
			}
		}
	}
}
