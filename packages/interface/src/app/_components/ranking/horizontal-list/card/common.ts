import type { BadgeType } from "@/components/ui/badge";

export const rankToBadgeType = (rank: number): BadgeType => {
	switch (rank) {
		case 1:
			return "river";
		case 2:
			return "yellow";
		default:
			return "rose";
	}
};
