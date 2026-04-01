import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { Skeleton } from "@semoss/ui/next";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { RootStore } from "@/stores";

export const EmbedPage: React.FC = observer(() => {
	const { t } = useTranslation("workspace");
	const { path } = useParams();
	const { root } = useRoot();
	const { chat } = useChat();

	const [isLoading, setIsLoading] = useState<boolean>(true);

	let matched: RootStore["theme"]["sidebar"]["headerItems"][number] = null;
	for (const item of root.theme.sidebar.headerItems) {
		if (item.path === path) {
			matched = item;
			break;
		}
	}

	if (!matched) {
		for (const item of root.theme.sidebar.footerItems) {
			if (item.path === path) {
				matched = item;
				break;
			}
		}
	}

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("breadcrumbs.home"),
				path: "/",
			},
			{
				name: matched?.name ?? path,
				path: `/embed/${path}`,
			},
		],
	});

	/*
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "SMSS_NEW_CHAT") {
				const { workspaceId, knowledgeId } =
					event.data.payload ?? {};
				if (workspaceId) {
					navigate(`/new?workspaceId=${workspaceId}`);
				} else if (knowledgeId) {
					navigate(`/new?knowledgeId=${knowledgeId}`);
				} else {
					navigate(`/new`);
				}
			} else if (event.data?.type === "SMSS_OPEN_ROOM") {
				const { roomId, jobId, prompt } = event.data.payload ?? {};
				if (roomId) {
					const params = new URLSearchParams();
					if (jobId) params.set("jobId", jobId);
					if (prompt) params.set("prompt", prompt);
					const qs = params.toString();
					navigate(
						qs ? `/room/${roomId}?${qs}` : `/room/${roomId}`,
					);
				}
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [navigate]);
	*/

	if (!matched) {
		return <Navigate to="/" replace />;
	} else if (chat.preloadedEmbedPathMap[path]) {
		// MainLayout has already pre-loaded this iframe and will show it on top —
		// render nothing here to avoid running a duplicate instance of the app.
		return null;
	}

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
			{isLoading && <Skeleton className="h-full w-full" />}
			{matched && (
				<iframe
					className="h-full w-full border-none"
					title={matched.name}
					src={matched.url}
					onLoad={() => {
						setIsLoading(false);
					}}
				/>
			)}
		</div>
	);
});
