"use client";

import {
	Content as PopoverContent,
	Popover as PopoverPrimitive,
	Root as PopoverRoot,
	Trigger as PopoverTrigger,
} from "@radix-ui/react-popover";
import {
	Content as TooltipContent,
	Tooltip as TooltipPrimitive,
	Provider as TooltipProvider,
	Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
import type * as React from "react";
import { useMediaQueryWithBreakpoint } from "@/api/hooks/useMediaQueryWithBreakpoint";

import { cn } from "@/lib/utils";

type Props = {
	children: React.ReactNode;
	content: React.ReactNode;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	cls?: {
		content?: string;
	};
	stopPropagation?: boolean;
	isOpen?: boolean;
	breakAll?: boolean;
	onOpenChange?: (open: boolean) => void;
	asChild?: boolean;
	className?: string;
};

export function Tooltip({
	children,
	content,
	side = "top",
	align = "center",
	cls,
	stopPropagation = true,
	isOpen,
	breakAll,
	asChild = false,
	className,
	onOpenChange,
}: Props) {
	const isMd = useMediaQueryWithBreakpoint("md");

	function handleOpenChange(open: boolean) {
		onOpenChange?.(open);
	}

	if (isMd) {
		return (
			<TooltipProvider delayDuration={100}>
				<TooltipPrimitive
					onOpenChange={handleOpenChange}
					open={isOpen}
				>
					<TooltipTrigger
						asChild={asChild}
						className={className}
						onClick={(e) => {
							if (stopPropagation) {
								e.stopPropagation();
							}
						}}
					>
						{children}
					</TooltipTrigger>
					<TooltipContent
						align={align}
						className={cn(
							"max-w-xs rounded-lg bg-cpn-tooltip px-4 py-2 text-p-xs text-itr-tone-tent break-words z-20 [&>span]:hidden",
							cls?.content,
							breakAll ? "break-all" : "",
						)}
						side={side}
					>
						{content}
					</TooltipContent>
				</TooltipPrimitive>
			</TooltipProvider>
		);
	}

	return (
		<PopoverRoot>
			<PopoverPrimitive
				onOpenChange={handleOpenChange}
				open={isOpen}
			>
				<PopoverTrigger
					asChild
					onClick={(e) => {
						if (stopPropagation) {
							e.stopPropagation();
						}
					}}
				>
					{children}
				</PopoverTrigger>
				<PopoverContent
					align={align}
					className={cn(
						"max-w-fit rounded-lg bg-cpn-tooltip px-4 py-2 text-p-xs text-itr-tone-tent focus:outline-none z-20",
						cls?.content,
						breakAll ? "break-all" : "",
					)}
					side={side}
				>
					{content}
				</PopoverContent>
			</PopoverPrimitive>
		</PopoverRoot>
	);
}
