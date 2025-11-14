import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [
				"text-title-h1",
				"text-title-h2",
				"text-title-h3",
				"text-title-h4",
				"text-title-h5",
				"text-title-h6",
				"text-label-xl-pri",
				"text-label-xl-sec",
				"text-label-lg-pri",
				"text-label-lg-sec",
				"text-label-md-pri",
				"text-label-md-sec",
				"text-label-sm-pri",
				"text-label-sm-sec",
				"text-label-xs-pri",
				"text-label-xs-sec",
				"text-label-2xs-pri",
				"text-label-2xs-sec",
				"text-p-xl",
				"text-p-lg",
				"text-p-md",
				"text-p-sm",
				"text-p-xs",
				"text-p-2xs",
				"text-sh-md",
				"text-sh-sm",
				"text-sh-xs",
				"text-sh-2xs",
			],
		},
	},
});

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
