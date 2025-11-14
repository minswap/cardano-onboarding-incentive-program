import type { SupportedExplorer } from "@/utils/explorer";

export const TOP_3 = 3;
export const TOP_RANKS = 20;
export const SUPPORT_ENDED_MAX_RANKS = 100;
export const DEFAULT_EXPLORER: SupportedExplorer = "cardanoscan";

export enum EventStatus {
	COMING_SOON = 0,
	ACTIVE = 1,
	BOOSTING_SEASON = 2,
	ENDED = 3,
	SUPPORT_ENDED = 4,
}

export function getEventStatus(
	now: number,
	start: number,
	boostingStart: number,
	end: number,
	contactEnd: number,
): EventStatus {
	switch (true) {
		case now < start:
			return EventStatus.COMING_SOON;
		case now < boostingStart:
			return EventStatus.ACTIVE;
		case now < end:
			return EventStatus.BOOSTING_SEASON;
		case now < contactEnd:
			return EventStatus.ENDED;
		default:
			return EventStatus.SUPPORT_ENDED;
	}
}

export type Multiplier = 5 | 2 | 1;

type TokenMultiplier = {
	currencySymbol: string;
	tokenName: string;
	multiplier: Multiplier;
	ticker: string;
};

export const TOKEN_MULTIPLIERS: TokenMultiplier[] = [
	// MIN
	{
		currencySymbol: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
		tokenName: "4d494e",
		multiplier: 5,
		ticker: "MIN",
	},
	// INDY
	{
		currencySymbol: "533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0",
		tokenName: "494e4459",
		multiplier: 2,
		ticker: "INDY",
	},
	//LQ
	{
		currencySymbol: "da8c30857834c6ae7203935b89278c532b3995245295456f993e1d24",
		tokenName: "4c51",
		multiplier: 2,
		ticker: "LQ",
	},
	// IAG
	{
		currencySymbol: "5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114",
		tokenName: "494147",
		multiplier: 2,
		ticker: "IAG",
	},
	// CHAD
	{
		currencySymbol: "97075bf380e65f3c63fb733267adbb7d42eec574428a754d2abca55b",
		tokenName: "436861726c6573207468652043686164",
		multiplier: 2,
		ticker: "CHAD",
	},
	// WMTX
	{
		currencySymbol: "e5a42a1a1d3d1da71b0449663c32798725888d2eb0843c4dabeca05a",
		tokenName: "576f726c644d6f62696c65546f6b656e58",
		multiplier: 2,
		ticker: "WMTX",
	},
	// STRIKE
	{
		currencySymbol: "f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275",
		tokenName: "535452494b45",
		multiplier: 2,
		ticker: "STRIKE",
	},
	// SNEK
	{
		currencySymbol: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
		tokenName: "534e454b",
		multiplier: 2,
		ticker: "SNEK",
	},
	// FLOW
	{
		currencySymbol: "2d9db8a89f074aa045eab177f23a3395f62ced8b53499a9e4ad46c80",
		tokenName: "464c4f57",
		multiplier: 2,
		ticker: "FLOW",
	},
	// FLDT
	{
		currencySymbol: "577f0b1342f8f8f4aed3388b80a8535812950c7a892495c0ecdf0f1e",
		tokenName: "0014df10464c4454",
		multiplier: 2,
		ticker: "FLDT",
	},
	// HOSKY
	{
		currencySymbol: "a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235",
		tokenName: "484f534b59",
		multiplier: 2,
		ticker: "HOSKY",
	},
	// Other CNTs
	{
		currencySymbol: "",
		tokenName: "",
		multiplier: 1,
		ticker: "Other CNTs",
	},
];
