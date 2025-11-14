import { RiErrorWarningFill } from "@remixicon/react";
import { BaseAlert } from "@/components/base-alert";
import { formatDate } from "@/utils/date";

export function ResultPendingAlert({ expiredContactTime, localTz }: { expiredContactTime: number; localTz?: boolean }) {
	return (
		<BaseAlert
			icon={<RiErrorWarningFill />}
			title="Results Drop Soon! 🚀"
			variant="warning"
		>
			<p className="text-p-sm text-itr-tone-wn">We're counting the results and will announce them soon!</p>

			<p className="text-p-sm text-itr-tone-wn">
				If you've been flagged as a bot, please{" "}
				<a
					className="underline underline-offset-2 text-label-sm-sec"
					href="https://discord.gg/minswap"
					rel="noopener"
					target="_blank"
				>
					contact us
				</a>{" "}
				on Discord for support before
				<span className="text-label-sm-sec"> {formatDate(new Date(expiredContactTime), localTz)}</span>
			</p>
		</BaseAlert>
	);
}
