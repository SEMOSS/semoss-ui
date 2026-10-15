/** Semantic colors and typography for chart libraries that require resolved CSS values. */
export interface ChartTokens {
	colors: string[];
	foreground: string;
	muted: string;
	border: string;
	background: string;
	primary: string;
	fontFamily: string;
}

/** Reads the active theme at the chart element; call again after a theme change. */
export function readChartTokens(element: HTMLElement): ChartTokens {
	const style = getComputedStyle(element);
	const token = (name: string): string =>
		style.getPropertyValue(`--${name}`).trim();
	return {
		colors: [1, 2, 3, 4, 5].map((index) => token(`chart-${index}`)),
		foreground: token("foreground"),
		muted: token("muted-foreground"),
		border: token("border"),
		background: token("popover"),
		primary: token("primary"),
		fontFamily: style.fontFamily,
	};
}
