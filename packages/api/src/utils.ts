import type { Decimal } from "@prisma/client/runtime/binary";
import type { FastifyRequest } from "fastify";

export type GracefulShutdownHandler = () => void;

const handlers: GracefulShutdownHandler[] = [];
let lock = false;

export function onShutdown(f: GracefulShutdownHandler): void {
	handlers.push(f);
}

function signalHandler(signal: string): void {
	if (lock) {
		return;
	} else {
		lock = true;
	}

	console.warn(`${signal} received, graceful shutdown...`);
	for (const handler of handlers) {
		handler();
	}
}

process.on("SIGINT", signalHandler);
process.on("SIGTERM", signalHandler);
process.on("SIGQUIT", signalHandler);

process.on("uncaughtException", (error, origin) => {
	signalHandler("uncaughtException");
	console.error("uncaughtException", { origin, error });
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	signalHandler("unhandledRejection");
	console.error("unhandledRejection", { promise, reason });
	process.exit(1);
});

export function getRealClientIP(req: FastifyRequest): string {
	return (
		getFirstHeaderValue(req.headers["cf-connecting-ip"]) ||
		getFirstHeaderValue(req.headers["x-original-forwarded-for"]) ||
		getFirstHeaderValue(req.headers["x-real-ip"]) ||
		getFirstHeaderValue(req.headers["x-forwarded-for"]) ||
		req.ip
	);
}

export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startOfUTCMinute(date: Date): Date {
	const newDate = new Date(date.getTime());
	newDate.setUTCSeconds(0, 0);
	return newDate;
}

export enum EnvKey {
	API_REDIS = "API_REDIS_URL",
	REDIS = "REDIS_URL",
	POSTGRES = "POSTGRES_URL",
	API_PORT = "API_PORT",
	INTERVAL = "INTERVAL",
	EVENT_START_TIME = "EVENT_START_TIME",
	EVENT_END_TIME = "EVENT_END_TIME",
	MINSWAP_THIRD_PARTY_API = "MINSWAP_THIRD_PARTY_API",
}

export function getEnv(key: string): string {
	const val = process.env[key];
	if (!val) {
		console.error(`Require environment variable ${key}`);
		throw new Error("Server init error");
	}
	return val;
}

/**
 *
 * @param value the big value without decimal places
 * @param decimals the number of desired decimal places
 * @returns the value with decimal places
 */
export function toNumberWithDecimal(value: bigint, decimals: number): number {
	if (value === 0n) {
		return 0;
	}
	const numberString = value.toString();
	if (numberString.length <= decimals) {
		return Number(`0.${numberString.padStart(decimals, "0")}`);
	}

	const postfix = numberString.slice(numberString.length - decimals).replace(/0+$/g, "");
	const decimalPoint = postfix.length ? "." : "";
	const prefix = numberString.slice(0, numberString.length - decimals);
	return Number(prefix + decimalPoint + postfix);
}

export function tryParseBigInt(value: string | number): bigint | null {
	try {
		return BigInt(value);
	} catch {
		return null;
	}
}

export function decimalToBigInt(x: Decimal): bigint {
	return BigInt(x.toFixed(0));
}

export function getFirstHeaderValue(header: string | string[] | undefined): string | undefined {
	if (header === undefined) {
		return undefined;
	}
	if (typeof header === "string") {
		return header;
	}
	return header[0];
}
