import invariant from "@minswap/tiny-invariant";
import {
	AddressType,
	CardanoAddress,
	type CardanoEnterpriseAddress,
	type CardanoRewardAddress,
	type Credential,
} from "./cardano-address";

export class Address {
	public readonly bech32: string;
	public readonly cardanoAddress: CardanoAddress;

	protected constructor(bech32: string) {
		this.bech32 = bech32;
		this.cardanoAddress = CardanoAddress.decodeCardanoAddress(bech32);
	}

	static fromBech32(s: string): Address {
		let address: Address | null = null;
		try {
			address = new Address(s);
		} catch (err) {
			throw new Error(`address is not valid bech32 or base58: ${s}: ${err}`);
		}
		return address;
	}

	static fromCardanoAddress(addr: CardanoAddress): Address {
		let address: Address | null = null;
		try {
			const bech32 = CardanoAddress.toBech32(addr);
			address = new Address(bech32);
		} catch (err) {
			throw new Error(`could not decode address from CardanoAddress: ${err}`);
		}
		return address;
	}

	toStakeAddress(): RewardAddress | null {
		switch (this.cardanoAddress.type) {
			case AddressType.BASE_ADDRESS: {
				const rewardAddress: CardanoRewardAddress = {
					type: AddressType.REWARD_ADDRESS,
					stake: this.cardanoAddress.stake,
				};
				return RewardAddress.fromAddress(Address.fromCardanoAddress(rewardAddress));
			}
			case AddressType.REWARD_ADDRESS: {
				return RewardAddress.fromBech32(this.bech32);
			}
		}
		return null;
	}

	toPaymentAddress(): Address | null {
		if (
			this.cardanoAddress.type === AddressType.REWARD_ADDRESS ||
			this.cardanoAddress.type === AddressType.LEGACY_ADDRESS
		) {
			return null;
		}
		const paymentCred = this.cardanoAddress.payment;
		const enterpriseAddr: CardanoEnterpriseAddress = {
			type: AddressType.ENTERPRISE_ADDRESS,
			payment: paymentCred,
		};
		return Address.fromCardanoAddress(enterpriseAddr);
	}
	/**
	 * If the address is a Reward Address (stake1...), then return the credential of the stake part.
	 * Otherwise, return the credential of the payment part.
	 */
	toPaymentCredential(): Credential | null {
		switch (this.cardanoAddress.type) {
			case AddressType.BASE_ADDRESS:
			case AddressType.ENTERPRISE_ADDRESS:
			case AddressType.POINTER_ADDRESS: {
				return this.cardanoAddress.payment;
			}
			case AddressType.REWARD_ADDRESS: {
				return this.cardanoAddress.stake;
			}
			case AddressType.LEGACY_ADDRESS: {
				return null;
			}
		}
	}

	equals(other: Address): boolean {
		return this.bech32 === other.bech32;
	}
}

export class RewardAddress extends Address {
	public override readonly cardanoAddress: CardanoRewardAddress;

	private constructor(bech32: string) {
		super(bech32);
		const cardanoAddr = CardanoAddress.decodeCardanoAddress(bech32);
		invariant(cardanoAddr.type === AddressType.REWARD_ADDRESS, `${bech32} is not reward address`);
		this.cardanoAddress = cardanoAddr;
	}

	static fromAddress(a: Address): RewardAddress {
		return new RewardAddress(a.bech32);
	}

	static override fromCardanoAddress(a: CardanoRewardAddress): RewardAddress {
		const bech32 = CardanoAddress.toBech32(a);
		return new RewardAddress(bech32);
	}

	static override fromBech32(s: string): RewardAddress {
		return new RewardAddress(s);
	}
}

export enum AddressIdentType {
	PAYMENT = "PAYMENT",
	STAKE = "STAKE",
}

export type AddressIdent = {
	type: AddressIdentType;
	bech32: string;
};

export function extractAddressIdent(addr: string | Address): AddressIdent {
	let address: Address;
	if (addr instanceof Address) {
		address = addr;
	} else {
		address = Address.fromBech32(addr);
	}
	const cardanoAddr = address.cardanoAddress;
	switch (cardanoAddr.type) {
		case AddressType.BASE_ADDRESS: {
			const rewardAddress: CardanoRewardAddress = {
				type: AddressType.REWARD_ADDRESS,
				stake: cardanoAddr.stake,
			};
			return {
				type: AddressIdentType.STAKE,
				bech32: Address.fromCardanoAddress(rewardAddress).bech32,
			};
		}
		case AddressType.ENTERPRISE_ADDRESS:
		case AddressType.POINTER_ADDRESS:
		case AddressType.LEGACY_ADDRESS: {
			return {
				type: AddressIdentType.PAYMENT,
				bech32: address.bech32,
			};
		}
		case AddressType.REWARD_ADDRESS: {
			return {
				type: AddressIdentType.STAKE,
				bech32: address.bech32,
			};
		}
	}
}
