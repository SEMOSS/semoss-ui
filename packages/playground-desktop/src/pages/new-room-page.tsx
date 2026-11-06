import { useSearchParams } from "react-router";
import { NewRoomView } from "@semoss/chat";

/**
 * A new chat, starting with the agent, knowledge or prompt its address
 * names.
 *
 * @component
 */
export const NewRoomPage = () => {
	const [searchParams] = useSearchParams();
	return (
		<NewRoomView
			agentId={searchParams.get("agentId")}
			knowledgeId={searchParams.get("knowledgeId")}
			initialPrompt={searchParams.get("prompt") ?? ""}
		/>
	);
};
