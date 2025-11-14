import type * as React from "react";
import { cn } from "@/lib/utils";

export function Divider({ className, ...rest }: React.ComponentProps<"div">): React.ReactElement {
	return (
		<div
			className={cn("h-px bg-bd-pri-sub", className)}
			{...rest}
		/>
	);
}
