import { useSearchParams } from "react-router";
import { Chat } from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** The page to start a new chat; its links name a prompt, agent, or knowledge base. */
export const NewRoomPage = () => {
	const [searchParams] = useSearchParams();
	const { altLandingKey } = usePlaygroundTheme();

	return (
		<Chat.NewChat
			initialPrompt={searchParams.get("prompt") ?? ""}
			workspaceId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			showAltLanding={!!altLandingKey && searchParams.has(altLandingKey)}
			headerLeading={<PageHeaderNavigation />}
		/>
	);
};
