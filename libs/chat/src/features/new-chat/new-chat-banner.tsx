import { useEffect, useRef } from "react";

/** Props for {@link NewChatBanner}. */
interface NewChatBannerProps {
	/** The banner's HTML, from a source the host trusts. Empty for none. */
	html: string;
	/** Its background color. Default: the primary color. */
	backgroundColor?: string;
	/** Its text color. Default: the primary color's foreground. */
	textColor?: string;
}

/**
 * A banner across the top of a new chat (`NewChat`'s `banner`), its links
 * opening in a new tab. Renders nothing without HTML.
 */
export const NewChatBanner = ({
	html,
	backgroundColor,
	textColor,
}: NewChatBannerProps) => {
	const bannerRef = useRef<HTMLDivElement>(null);

	// open the banner's links in a new tab
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

	if (!html) return null;
	return (
		<div
			ref={bannerRef}
			className="w-full shrink-0 px-4 py-2 text-center text-sm [&_a]:underline"
			style={{
				backgroundColor: backgroundColor || "var(--primary)",
				color: textColor || "var(--primary-foreground)",
			}}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: the host's own HTML, from a source it trusts
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
