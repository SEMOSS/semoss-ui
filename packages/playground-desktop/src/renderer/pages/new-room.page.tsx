import { useSearchParams } from "react-router";
import { Chat } from "@semoss/chat";
import { SidebarTrigger } from "@semoss/ui/next";

/** A new chat; a link may name its prompt, agent, or knowledge base. */
export const NewRoomPage = () => {
	const [searchParams] = useSearchParams();

	return (
		<Chat.NewChat
			initialPrompt={searchParams.get("prompt") ?? ""}
			workspaceId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			headerLeading={<SidebarTrigger />}
		/>
	);
};
