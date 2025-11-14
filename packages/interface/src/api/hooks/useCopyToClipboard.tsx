import * as React from "react";

export function useCopyToClipboard() {
	const [isCopied, setIsCopied] = React.useState(false);

	const copyToClipboard = React.useCallback((text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		});
	}, []);

	return { isCopied, copyToClipboard };
}
