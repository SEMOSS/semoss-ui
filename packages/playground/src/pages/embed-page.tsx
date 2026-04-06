import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { useChat, useGlobalBreadcrumbs } from "@/hooks";

export const EmbedPage: React.FC = observer(() => {
	const { t } = useTranslation("workspace");
	const { "*": splatPath } = useParams();
	const basePath = splatPath?.split("/")[0] ?? "";
	const { chat } = useChat();
	const navigate = useNavigate();

	const pageInfo = chat.embeddedPageMap[basePath] ?? null;

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("breadcrumbs.home"),
				path: "/",
			},
			{
				name: pageInfo?.name ?? basePath,
				path: `/embed/${basePath}`,
			},
		],
	});

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "SMSS_NEW_CHAT") {
				const { workspaceId, knowledgeId } = event.data.payload ?? {};
				if (workspaceId) {
					navigate(`/new?workspaceId=${workspaceId}`);
				} else if (knowledgeId) {
					navigate(`/new?knowledgeId=${knowledgeId}`);
				} else {
					navigate(`/new`);
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
});
