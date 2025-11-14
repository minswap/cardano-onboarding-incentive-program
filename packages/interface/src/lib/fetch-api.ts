import ky from "ky";

import { CONFIG } from "@/constants/config";

export const fetchApi = ky.create({
	prefixUrl: CONFIG.NEXT_PUBLIC_API_ENDPOINT,
	timeout: 30_000,
});
