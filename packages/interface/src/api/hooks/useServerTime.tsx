import { useQuery } from "@tanstack/react-query";
import { getServerTime } from "../getServerTime";

export function useServerTime() {
	const { data } = useQuery({
		queryKey: ["server-time"],
		queryFn: async () => {
			return getServerTime();
		},
		staleTime: Infinity,
	});

	const currServerTime = data ? Number(data.data.serverTime) : Date.now();
	return currServerTime;
}
