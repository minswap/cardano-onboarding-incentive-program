const HEX_REGEX = /^[a-f0-9]*$/i;
const isValidHex = (s: string): boolean => HEX_REGEX.test(s);

export class Bytes {
	readonly bytes: Uint8Array;
	readonly hex: string;

	constructor(bytes: Uint8Array) {
		this.bytes = new Uint8Array(bytes); // coerc type
		this.hex = Buffer.from(this.bytes).toString("hex");
	}

	get length(): number {
		return this.bytes.length;
	}

	static fromHex(s: string): Bytes {
		if (!isValidHex(s)) {
			throw new Error(`invalid hex: ${s}`);
		}
		return new Bytes(Uint8Array.from(Buffer.from(s, "hex")));
	}

	clone(): Bytes {
		const arr = new Uint8Array(this.bytes.length);
		for (let i = 0; i < this.bytes.length; i++) {
			arr[i] = this.bytes[i];
		}
		return new Bytes(arr);
	}
}
