import { useSuspenseQuery } from "@tanstack/react-query";
import { getEventStat, parseEventStat } from "../getEventStat";

export function useEventStat() {
	return useSuspenseQuery({
		queryKey: ["event-stat"],
		queryFn: async () => {
			return getEventStat();
		},
		select: parseEventStat,
		refetchInterval: 60_000,
	});
}
