import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useChatSelector, useChatSession } from "@semoss/chat";

/**
 * The route for an embedded page (`/embed/<path>`). `MainLayout` already keeps
 * that page's iframe mounted and shows it, so this route only sends an unknown
 * path home and turns the iframe's messages into navigation.
 */
export const EmbedPage: React.FC = () => {
	const { "*": splatPath } = useParams();
	const basePath = splatPath?.split("/")[0] ?? "";
	const { chat } = useChatSession();
	const navigate = useNavigate();

	const pageInfo = useChatSelector(
		chat,
		(chat) => chat.embeddedPageMap[basePath] ?? null,
	);

	// The embedded app asks the playground to start a chat or open a room.
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "SMSS_NEW_CHAT") {
				const { workspaceId, knowledgeId, prompt } =
					event.data.payload ?? {};
				const promptParam = prompt
					? `?prompt=${encodeURIComponent(prompt)}`
					: "";
				if (workspaceId) {
					navigate(`/new?workspaceId=${workspaceId}`);
				} else if (knowledgeId) {
					navigate(`/new?knowledgeId=${knowledgeId}`);
				} else {
					navigate(`/new${promptParam}`);
				}
			} else if (event.data?.type === "SMSS_OPEN_ROOM") {
				const { roomId } = event.data.payload ?? {};
				if (roomId) {
					navigate(`/room/${roomId}`);
				}
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [navigate]);

	if (!pageInfo) {
		return <Navigate to="/" replace />;
	}

	// MainLayout has already pre-loaded this iframe and will show it on top —
	// render nothing here to avoid running a duplicate instance of the app.
	return null;
};
