import { useSearchParams } from "react-router";
import {
	NewChat,
	NewChatBackdrop,
	NewChatBanner,
	NewChatWelcome,
} from "@semoss/chat";
import { SidebarTrigger } from "@semoss/ui/next";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/**
 * A new chat; a link may name its prompt, agent, or knowledge base. The
 * server theme's banner, landing image, and landing fill the chat's places.
 */
export const NewChatPage = () => {
	const [searchParams] = useSearchParams();
	const theme = usePlaygroundTheme();

	return (
		<NewChat
			initialPrompt={searchParams.get("prompt") ?? ""}
			workspaceId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			headerLeading={<SidebarTrigger />}
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
					html={theme.landing}
					description={theme.description}
				/>
			}
		/>
	);
};
