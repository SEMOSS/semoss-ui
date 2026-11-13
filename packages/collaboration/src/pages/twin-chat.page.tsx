import { useSearchParams } from "react-router";
import { TwinChatStart } from "@/features/digital-twin/twin-chat-start";

/** Where a chat with the Digital Twin the address names starts; fresh for each twin. */
export function TwinChatPage() {
	const [params] = useSearchParams();
	const agentId = params.get("agentId") ?? "";
	return <TwinChatStart key={agentId} agentId={agentId} />;
}
