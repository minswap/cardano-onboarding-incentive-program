import { RiFlag2Fill } from "@remixicon/react";
import { Tooltip } from "./tooltip";
import { Badge } from "./ui/badge";

export function BotFlagBadge({ flags }: { flags: number }) {
	return (
		<Tooltip
			cls={{ content: "max-w-[280px]" }}
			content={
				<ul className="space-y-6">
					<li>
						Wallets are rated based on their behavior and given flags for suspected of being bots (e.g. high amount of
						trades, single token focus).
					</li>
					<li>
						If you've been flagged as a bot, please{" "}
						<a
							className="underline underline-offset-2 text-label-xs-sec"
							href="https://discord.gg/minswap"
							rel="noopener"
							target="_blank"
						>
							contact us
						</a>{" "}
						on Discord for support{" "}
					</li>
				</ul>
			}
		>
			<Badge
				content={flags.toString()}
				iconLeft={<RiFlag2Fill className="size-3 text-itr-tone-dg-sub" />}
				type="danger"
			/>
		</Tooltip>
	);
}
