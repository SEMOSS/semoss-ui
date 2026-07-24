import { useEffect, useState } from "react";

/**
 * Returns true when the document is in dark mode.
 *
 * Watches the "dark" class on <html> directly via MutationObserver so it
 * stays correct regardless of how the ThemeProvider version is compiled or
 * whether it dispatches custom events.
 */
export const useIsDark = (): boolean => {
	const [isDark, setIsDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains("dark"));
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, []);

	return isDark;
};
