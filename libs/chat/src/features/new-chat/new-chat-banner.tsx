import { useEffect, useRef } from "react";
import { useChatConfig } from "../chat/config/use-chat-config";

/**
 * The theme's banner across the top of a new chat, its links opening in a new
 * tab. Renders nothing without a banner.
 */
export const NewChatBanner = () => {
	const { theme } = useChatConfig();
	const bannerRef = useRef<HTMLDivElement>(null);

	// open the banner's links in a new tab
	useEffect(() => {
		if (!bannerRef.current) return;
		// The url stripping here is primarily due to a BE theme bug where single quote apostrophes get serial added when saving
		const urls = (theme.banner ?? "").match(/https?:\/\/[^\s'"<>]+/g) ?? [];
		bannerRef.current
			.querySelectorAll("a")
			.forEach((a: HTMLAnchorElement, i: number) => {
				a.target = "_blank";
				a.rel = "noopener noreferrer";
				if (urls[i]) a.setAttribute("href", urls[i]);
			});
	}, [theme.banner]);

	if (!theme.banner) return null;
	return (
		<div
			ref={bannerRef}
			className="w-full shrink-0 px-4 py-2 text-center text-sm [&_a]:underline"
			style={{
				backgroundColor:
					theme.bannerBackgroundColor || "var(--primary)",
				color: theme.bannerTextColor || "var(--primary-foreground)",
			}}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
			dangerouslySetInnerHTML={{ __html: theme.banner }}
		/>
	);
};
