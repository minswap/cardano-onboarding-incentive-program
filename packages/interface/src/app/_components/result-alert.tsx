import { RiAwardFill } from "@remixicon/react";
import { BaseAlert } from "@/components/base-alert";

export function ResultAlert() {
	return (
		<BaseAlert
			icon={<RiAwardFill />}
			title="The airdrop will be distributed soon! 🚀"
			variant="highlight"
		>
			The final winners list is below. We have excluded any wallet deemed a bot. These 'bot' wallets were detected by an
			in-house anti-bot filter followed by a manual review of each instance.
		</BaseAlert>
	);
}
