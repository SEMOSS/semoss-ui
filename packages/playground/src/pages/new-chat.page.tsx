import { useSearchParams } from "react-router";
import {
	NewChat,
	NewChatBackdrop,
	NewChatBanner,
	NewChatWelcome,
} from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/**
 * The page to start a new chat; its links name a prompt, agent, or knowledge
 * base. The theme's banner, landing image, and landing (its alternate one when
 * the link has the theme's `altLandingKey`) fill the chat's places.
 */
export const NewChatPage = () => {
	const [searchParams] = useSearchParams();
	const theme = usePlaygroundTheme();
	const hasAltLanding =
		!!theme.altLandingKey &&
		searchParams.has(theme.altLandingKey) &&
		!!theme.altLanding;

	return (
		<NewChat
			initialPrompt={searchParams.get("prompt") ?? ""}
			workspaceId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			headerLeading={<PageHeaderNavigation />}
			banner={
				<NewChatBanner
					html={theme.banner}
					backgroundColor={theme.bannerBackgroundColor}
					textColor={theme.bannerTextColor}
				/>
			}
			backdrop={
				<NewChatBackdrop
					src={theme.images.landing}
					darkSrc={theme.images.landingDark}
				/>
			}
			welcome={
				<NewChatWelcome
					html={
						theme.landing && hasAltLanding
							? theme.altLanding
							: theme.landing
					}
					description={theme.description}
				/>
			}
		/>
	);
};
