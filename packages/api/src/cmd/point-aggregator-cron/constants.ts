import { SupportedCoin } from "../../service/historical-price/types";

// event prize configs
const BASE_PRIZE_POOL = 100_000_000_000n; // 100,000 ADA
const MAX_USER_TIER_1 = 20;
const MAX_USER_TIER_2 = 80;
const POOL_ALLOC_TIER_1 = 70; // 70% of total pool prize
const POOL_ALLOC_TIER_2 = 30; // 30% of total pool prize
const DEFAULT_POOL_ALLOC_DEN = 100;

const CROSS_CHAIN_ASSETS: Record<string, SupportedCoin> = {
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.455448": SupportedCoin.ETH,
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69534f4c": SupportedCoin.SOL, // iSOL
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.534f4c": SupportedCoin.SOL,
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69425443": SupportedCoin.BTC, // iBTC
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443": SupportedCoin.BTC,
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69455448": SupportedCoin.ETH, // iETH
};

const MAP_ASSET_TO_MULTIPLIER: Record<string, number> = {
	"29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6.4d494e": 5, // MIN
	"533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459": 2, // INDY
	"da8c30857834c6ae7203935b89278c532b3995245295456f993e1d24.4c51": 2, // LQ
	"5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114.494147": 2, // IAG
	"97075bf380e65f3c63fb733267adbb7d42eec574428a754d2abca55b.436861726c6573207468652043686164": 2, // CHAD
	"2d9db8a89f074aa045eab177f23a3395f62ced8b53499a9e4ad46c80.464c4f57": 2, // FLOW
	"279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f.534e454b": 2, // SNEK
	"e5a42a1a1d3d1da71b0449663c32798725888d2eb0843c4dabeca05a.576f726c644d6f62696c65546f6b656e58": 2, // WMTX
	"577f0b1342f8f8f4aed3388b80a8535812950c7a892495c0ecdf0f1e.0014df10464c4454": 2, // FLDT
	"f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275.535452494b45": 2, // STRIKE
	"a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235.484f534b59": 2, // HOSKY
};

// TODO: maybe don't hardcode this
const STABLE_ASSET_DECIMALS: Record<string, number> = {
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.455448": 8, // ETH
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69534f4c": 6, // iSOL
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.534f4c": 8, // SOL
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69425443": 6, // iBTC
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443": 8, // BTC
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69455448": 6, // iETH
	"8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344": 6, // DJED
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69555344": 6, // iUSD
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443": 8, // USDC
	"c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d": 6, // USDM
	"92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c.4d79555344": 6, // MyUSD
	"fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441": 6, // USDA
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534454": 8, // USDT
};

const STABLE_ASSETS: Set<string> = new Set([
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.455448", // ETH
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69534f4c", // iSOL
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.534f4c", // SOL
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69425443", // iBTC
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443", // BTC
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69455448", // iETH
	"8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344", // DJED
	"f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69555344", // iUSD
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443", // USDC
	"c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d", // USDM
	"92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c.4d79555344", // MyUSD
	"fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441", // USDA
	"25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534454", // USDT
]);

const BOT_BLACKLIST = [
	"stake1u83ekh6q42zlhsfp5cjawaa8wmk2rj6vjg6zd9yun97cs2q26390l",
	"stake1uxumzvz4wqz64n4sca2yrmg0y29vm7h04203ff72h65rdtsvx9a4c",
	"stake1u9xeh3z7t5v3usyfg8gcmwavr472wdltsgf56yk6855vj5qvvx2vf",
	"stake1u8x35ez0geeqjftf58jx29srgvj76qzw2xmnlry5uwfzrcckwtt9p",
	"stake1uxve0pwncrsky5mfxja6eym8puweuekmrsxpeqnhup8nj0q2xnd6s",
	"stake1uy7lcr4kxfn0y5ufg3a3m6yfcrqcfuy9sl8sg9uejdjkfqg0we9t6",
	"stake1u9rulzvgdzy6jmwjx38wydsgjuehkexleds9fx08jzp288q33xu78",
	"stake1u9p5w9tny79pcwky73ugdmnd76g5xwj28fu8shasw68vuxcpsd50g",
	"stake1u84h5ey327cclr6f3288r2rhwefe8w25w40kqc935zn7hegvk3nmf",
	"stake1u9wdh0njs8d76382chg58gfav6yvehrsn672e0fss9v6ahg2v03dl",
	"stake1u8tpsrkceradm3mdrgynnfjpezvy9np2e2d7jynfvpjd63cnsdjge",
	"stake1u9dx4zd0rhs2qwtgaeqmfu3ffw5tpvn4agzv50e62n6n0dcxt73n6",
	"stake1uxqu4wdwcs3mztrshdvtca0sgtq8y80pvqlxjyrzd3evsssrgkcc5",
	"stake1uyr4375s007pywl7ymzq29tl9uec9wy2tg73gt8lws9kyuq545g8x",
	"stake1ux2tu09ywyc5rfc37dqepd2zk64tg0llkvk5rcjpd0eruxs4t2ntf",
	"stake1uxmvuunyvzr5pzq47qr6w9e7cldrf4dnmyf40e6mthxtysqqthgu9",
	"stake1u8e4c6af6h9rtke5sga3agau2c6wdknmu9fvdmrpryxyxmskzxqmy",
	"stake1uynda7kvcjf4d4aec7ltlkefzy8283j3yrp6cwx7t8ehf3guuu4qr",
];

export {
	BASE_PRIZE_POOL,
	MAX_USER_TIER_1,
	MAX_USER_TIER_2,
	POOL_ALLOC_TIER_1,
	POOL_ALLOC_TIER_2,
	CROSS_CHAIN_ASSETS,
	STABLE_ASSET_DECIMALS,
	DEFAULT_POOL_ALLOC_DEN,
	MAP_ASSET_TO_MULTIPLIER,
	STABLE_ASSETS,
	BOT_BLACKLIST,
};
