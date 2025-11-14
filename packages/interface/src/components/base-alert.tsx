"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT_MAP: Record<
	AlertVariant,
	{
		container: string;
		icon: string;
		title: string;
		body: string;
	}
> = {
	highlight: {
		container: "bg-sf-hl-df",
		icon: "text-itr-tone-hl",
		title: "text-itr-tone-hl text-label-md-pri",
		body: "text-itr-tent-pri-df text-p-sm",
	},
	warning: {
		container: "bg-sf-wn-df",
		icon: "text-itr-tone-wn-sub",
		title: "text-itr-tone-wn text-label-md-pri",
		body: "text-itr-tone-wn text-p-sm",
	},
};

type AlertVariant = "highlight" | "warning";

type BaseAlertProps = {
	icon: React.ReactNode;
	variant: AlertVariant;
	title: string;
	children: ReactNode;
	className?: string;
};

export function BaseAlert({ icon, variant, title, children, className }: BaseAlertProps) {
	const variants = VARIANT_MAP[variant];

	return (
		<div className={cn("p-4 w-full flex gap-4 rounded-[20px]", variants.container, className)}>
			<span className={cn("shrink-0", variants.icon)}>{icon}</span>
			<div className="flex flex-col gap-1">
				<h5 className={variants.title}>{title}</h5>
				<div className={variants.body}>{children}</div>
			</div>
		</div>
	);
}
