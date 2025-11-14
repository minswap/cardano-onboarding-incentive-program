import type * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "sub";

const VARIANT_MAP: Record<ButtonVariant, string> = {
	primary: cn(
		"bg-itr-tone-pri border-transparent text-cpn-tent",
		"hover:bg-itr-tent-sec-df hover:border-transparent hover:text-itr-tone-tent",
		"active:bg-itr-tent-sec-sub active:border-transparent active:text-itr-tone-tent",
		"disabled:border-transparent disabled:bg-sf-pri-dis disabled:text-itr-tent-sec-dis",
	),
	secondary: cn(
		"bg-base-empty border border-itr-tent-sec-sub text-itr-tent-sec-df",
		"hover:bg-itr-tent-sec-df hover:text-itr-tone-tent hover:border-transparent",
		"active:border-transparent active:bg-itr-tent-sec-sub active:text-itr-tone-tent",
		"disabled:border-sf-pri-dis disabled:bg-transparent disabled:text-itr-tent-pri-dis",
	),
	sub: cn(
		"bg-sf-pri-df border-transparent text-itr-tent-sec-df",
		"hover:bg-sf-pri-hv hover:border-transparent hover:text-itr-tent-sec-df",
		"active:bg-sf-pri-pressed active:border-transparent active:text-itr-tent-sec-df",
		"disabled:bg-sf-pri-dis disabled:border-transparent disabled:text-itr-tent-sec-dis",
	),
};

function Button({
	className,
	iconRight,
	disabled,
	children,
	variant = "primary",
	...props
}: React.ComponentProps<"button"> & {
	iconRight?: React.ReactNode;
	variant?: ButtonVariant;
}) {
	return (
		<button
			className={cn(
				"font-inter",
				"h-9 px-5 py-2 has-[>svg]:px-3",
				"cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-label-sm-sec transition-all",
				VARIANT_MAP[variant],
				className,
			)}
			data-slot="button"
			disabled={disabled}
			{...props}
		>
			{children}
			{iconRight && <span className="flex items-center size-4">{iconRight}</span>}
		</button>
	);
}

export { Button };
