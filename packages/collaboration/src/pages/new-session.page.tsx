import { useLocation } from "react-router";
import { NewChatSession } from "@/features/daily-chat/new-chat-session";

/** Keep the welcome composer at /new until its first valid submission begins. */
export function NewSessionPage() {
	const location = useLocation();
	return (
		<NewChatSession key={location.key} navigationState={location.state} />
	);
}
