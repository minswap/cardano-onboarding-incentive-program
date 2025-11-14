import { useQuery } from "@tanstack/react-query";
import { getRankByAddress, parseRankEntryResponse } from "../getRankByAddress";

export function useRankByAddress({ address }: { address: string }) {
	return useQuery({
		queryKey: ["rank", address],
		queryFn: async () => {
			return getRankByAddress({ address });
		},
		select: parseRankEntryResponse,
		enabled: !!address,
		refetchInterval: 60_000,
		refetchOnWindowFocus: false,
	});
}
