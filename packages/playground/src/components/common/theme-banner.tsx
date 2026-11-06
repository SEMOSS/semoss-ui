import { useEffect, useRef } from "react";

/** Props for {@link ThemeBanner}. */
export interface ThemeBannerProps {
	/** The theme's banner HTML. */
	html: string;
	/** Its background; the primary color when unset. */
	backgroundColor?: string;
	/** Its text color; the primary foreground when unset. */
	textColor?: string;
}

/**
 * The theme's announcement banner, full width above a page. Its links open
 * in a new tab.
 *
 * @component
 */
export const ThemeBanner = ({
	html,
	backgroundColor,
	textColor,
}: ThemeBannerProps) => {
	const bannerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!bannerRef.current) return;
		// The url stripping here is primarily due to a BE theme bug where single quote apostrophes get serial added when saving
		const urls = html.match(/https?:\/\/[^\s'"<>]+/g) ?? [];
		bannerRef.current
			.querySelectorAll("a")
			.forEach((a: HTMLAnchorElement, i: number) => {
				a.target = "_blank";
				a.rel = "noopener noreferrer";
				if (urls[i]) a.setAttribute("href", urls[i]);
			});
	}, [html]);

	return (
		<div
			ref={bannerRef}
			className="w-full shrink-0 px-4 py-2 text-center text-sm [&_a]:underline"
			style={{
				backgroundColor: backgroundColor || "var(--primary)",
				color: textColor || "var(--primary-foreground)",
			}}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
