import { fetchApi } from "@/lib/fetch-api";

export type ServerTimeResponse = {
	data: {
		serverTime: string;
	};
};

export function getServerTime(): Promise<ServerTimeResponse> {
	return fetchApi("server-time").json();
}
