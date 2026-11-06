import { useSearchParams } from "react-router";
import { NewRoomView } from "@semoss/chat";
import { ThemeBanner } from "@/components/common/theme-banner";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";
import { useIsDarkMode } from "@/hooks/use-is-dark-mode";
import { useRoot } from "@/hooks/use-root";

/**
 * A new chat, starting with the agent, knowledge or prompt its address
 * names, under the theme's banner and landing.
 *
 * @component
 */
export const NewRoomPage = () => {
	const { root } = useRoot();
	const { theme } = root;
	const [searchParams] = useSearchParams();
	const isDark = useIsDarkMode();
	const landingSrc = isDark ? theme.images.landingDark : theme.images.landing;
	// a key in the address can swap the landing for an alternate one
	const landingHtml =
		theme.altLandingKey &&
		searchParams.has(theme.altLandingKey) &&
		theme.altLanding
			? theme.altLanding
			: theme.landing;

	return (
		<NewRoomView
			agentId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			initialPrompt={searchParams.get("prompt") ?? ""}
			headerLeading={<PageHeaderNavigation />}
			banner={
				theme.banner ? (
					<ThemeBanner
						html={theme.banner}
						backgroundColor={theme.bannerBackgroundColor}
						textColor={theme.bannerTextColor}
					/>
				) : null
			}
			background={
				landingSrc ? (
					<img
						src={landingSrc}
						alt=""
						className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
					/>
				) : null
			}
			welcome={
				landingHtml ? (
					<div
						className="mx-auto flex max-w-xl"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
						dangerouslySetInnerHTML={{ __html: landingHtml }}
					/>
				) : undefined
			}
			description={theme.description || undefined}
		/>
	);
};
