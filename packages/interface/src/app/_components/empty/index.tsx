import Image from "next/image";
import Link from "next/link";
import diamondIcon from "@/app/_assets/images/4x-diamond.webp";
import { Button } from "@/components/ui/button";
import { CONFIG } from "@/constants/config";

export function EmptyLeaderboard() {
	return (
		<div className="px-2 flex flex-col items-center gap-6">
			<Image
				alt="Diamond Icon"
				className="size-[156px]"
				src={diamondIcon}
			/>
			<div className="flex flex-col gap-2 items-center">
				<h6 className="text-itr-tent-pri-df text-title-h6">No Paw Prints Yet</h6>
				<p className="text-itr-tent-pri-sub text-p-sm">Be the first feline on the board - early paws get the prize!</p>
			</div>
			<Link
				href={`${CONFIG.NEXT_PUBLIC_MINSWAP_URL}/swap`}
				target="_parent"
			>
				<Button className="w-32 h-11">Trade now</Button>
			</Link>
		</div>
	);
}
