import * as React from "react";
import defaultTheme from "tailwindcss/defaultTheme";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1280;

const deviceQueries = {
	mobile: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
	tablet: `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`,
	desktop: `(min-width: ${TABLET_BREAKPOINT}px)`,
};

const breakpointQueries = defaultTheme.screens;

type ScreenKey = "sm" | "md" | "lg" | "xl" | "2xl";

export function useMediaQueryWithBreakpoint(query: "mobile" | "tablet" | "desktop" | ScreenKey | string) {
	const [matches, setMatches] = React.useState<boolean>(false);

	React.useEffect(() => {
		let matchQuery = "";
		if (query in deviceQueries) {
			matchQuery = deviceQueries[query as keyof typeof deviceQueries];
		} else if (query in breakpointQueries) {
			matchQuery = `(min-width: ${breakpointQueries[query as ScreenKey]})`;
		} else {
			matchQuery = query;
		}
		const mql = window.matchMedia(matchQuery);
		const onChange = () => setMatches(mql.matches);
		mql.addEventListener("change", onChange);
		onChange();
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
