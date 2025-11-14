import Lottie from "lottie-react";
import fireAnimation from "public/animations/fire-animation.json";
import type * as React from "react";
import { cn } from "@/lib/utils";
export type BadgeType = "yellow" | "rose" | "river" | "danger" | "sub";

const TYPE_CSS_MAP: Record<
	BadgeType,
	{
		container: string;
		content: string;
	}
> = {
	yellow: {
		container: "bg-dec-yellow-df",
		content: "text-dec-yellow-sub",
	},
	rose: {
		container: "bg-dec-rose-df",
		content: "text-dec-rose-sub",
	},
	river: {
		container: "bg-brand-river",
		content: "text-brand-strong",
	},
	danger: {
		container: "bg-sf-dg-df",
		content: "text-itr-tone-dg",
	},
	sub: {
		container: "bg-sf-pri-sub",
		content: "text-itr-tent-pri-sub",
	},
};

type Props = React.ComponentProps<"div"> & {
	content: string;
	type?: BadgeType;
	iconLeft?: React.ReactNode;
	hasFrame?: boolean;
	cls?: { content: string };
};

function Badge({ className, hasFrame, cls, type = "river", iconLeft, content, ...props }: Props) {
	const css = TYPE_CSS_MAP[type];

	return (
		<div className="relative">
			<div
				className={cn(
					"inline-flex shrink-0 items-center rounded-full px-3 py-1 h-6 relative z-10",
					css.container,
					className,
				)}
				{...props}
			>
				{iconLeft && <span className="mr-1">{iconLeft}</span>}
				<p className={cn("text-label-xs-sec", css.content, cls?.content)}>{content}</p>
			</div>
			{hasFrame && (
				<div className="z-0 absolute -right-2 -top-5 w-12 h-[27px]">
					<Lottie
						animationData={fireAnimation}
						autoPlay={true}
						loop={true}
						muted={true}
						playsInline={true}
					/>
				</div>
			)}
		</div>
	);
}

export { Badge };
