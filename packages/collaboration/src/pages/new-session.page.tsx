import { useLocation } from "react-router";
import { NewChatSession } from "@/features/daily-chat/new-chat-session";

/** Keep a fresh chat at /new until its first accepted message creates a saved room. */
export function NewSessionPage() {
	const location = useLocation();
	return (
		<NewChatSession key={location.key} navigationState={location.state} />
	);
}
