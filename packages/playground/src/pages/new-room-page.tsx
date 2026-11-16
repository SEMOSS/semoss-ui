import { useSearchParams } from "react-router";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";
import { NewChat } from "@/features/new-chat/new-chat";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";

/** The page to start a new chat; its links name a prompt, agent, or knowledge base. */
export const NewRoomPage = () => {
	const [searchParams] = useSearchParams();
	const { altLandingKey } = usePlaygroundTheme();

	return (
		<NewChat
			initialPrompt={searchParams.get("prompt") ?? ""}
			workspaceId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			showAltLanding={!!altLandingKey && searchParams.has(altLandingKey)}
			headerLeading={<PageHeaderNavigation />}
		/>
	);
};
