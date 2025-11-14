import { RiArrowRightUpLine } from "@remixicon/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LinkButton({
	className,
	href,
	showIcon,
	children,
}: {
	className?: string;
	href: string;
	showIcon?: boolean;
	children: React.ReactNode;
}) {
	const isExternal = typeof href === "string" && href.startsWith("http");

	return (
		<Link
			className={cn(
				"flex items-center gap-1 text-itr-tent-pri-df underline underline-offset-4",
				"hover:text-itr-tone-hl",
				className,
			)}
			href={href}
			rel={isExternal ? "noopener noreferrer" : undefined}
			target={isExternal ? "_blank" : undefined}
		>
			{children}
			{showIcon && <RiArrowRightUpLine size={16} />}
		</Link>
	);
}
