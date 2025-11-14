import { fetchApi } from "@/lib/fetch-api";

export type EventStatResponse = {
	data: {
		prizePoolAda: number;
		prizePoolUsd: number;
		totalTradingVolume: number;
		totalTrades: number;
		totalTraders: number;
		totalPoints: number;
		startDate: string; // ISO 8601 ("2025-07-07T10:08:50.576519Z")
		endDate: string; // ISO 8601 ("2025-07-07T10:08:50.576519Z")
		startOfBoostingWeek: string; // ISO 8601 ("2025-07-07T10:08:50.576519Z")
	};
};

export type EventStat = {
	prizePool: number;
	prizePoolUsd: number;
	totalTradingVolume: number;
	totalTrades: number;
	totalTraders: number;
	totalPoints: number;
	startDate: number;
	endDate: number;
	startOfBoostingWeek: number;
};

export function getEventStat(): Promise<EventStatResponse> {
	return fetchApi("event-stats").json();
}

export function parseEventStat(response: EventStatResponse): EventStat {
	return {
		...response.data,
		prizePool: response.data.prizePoolAda,
		startDate: new Date(response.data.startDate).getTime(),
		endDate: new Date(response.data.endDate).getTime(),
		startOfBoostingWeek: new Date(response.data.startOfBoostingWeek).getTime(),
	};
}
