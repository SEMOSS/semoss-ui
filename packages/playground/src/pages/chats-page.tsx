import { Navigate } from "react-router";
import { RoomsListView } from "@semoss/chat";
import { useRoot } from "@/hooks/use-root";

/**
 * Every chat the user has, unless the theme hides chat history.
 *
 * @component
 */
export const ChatsPage = () => {
	const { root } = useRoot();
	if (root.theme.featureFlags?.hideChatHistory) {
		return <Navigate to="/" replace />;
	}
	return <RoomsListView />;
};
