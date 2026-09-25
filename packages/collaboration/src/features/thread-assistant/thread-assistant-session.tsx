import { useEffect, useMemo, useSyncExternalStore } from "react";
import { InsightContext } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import { toolMessageTimestamps } from "@/features/messages/utils/message-metadata";
import { toolsFromMessages } from "@/features/messages/utils/thread-items";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import type { InsightActions } from "@/lib/pixel";
import type { ThreadAssistantProps } from "./thread-assistant.types";
import { ThreadAssistantView } from "./thread-assistant-view";
import { getThreadSession } from "./thread-session";

export function ThreadAssistantSession({
	scope,
	ownerActions,
	...props
}: ThreadAssistantProps & { scope: string; ownerActions: InsightActions }) {
	const session = useMemo(
		() => getThreadSession(scope, props.threadId, ownerActions),
		[scope, props.threadId, ownerActions],
	);
	const snapshot = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
		session.getSnapshot,
	);
	useEffect(() => {
		const release = session.retain();
		void session.initialize();
		return release;
	}, [session]);
	useEffect(() => {
		if (snapshot.isReady)
			props.onInsightReady?.({
				insightId: session.insight.insightId,
				actions: session.insight.actions,
			});
	}, [props.onInsightReady, session, snapshot.isReady]);
	const tools = useMemo(
		() =>
			toolsFromMessages(
				snapshot.turn.messages,
				snapshot.turn.pendingApprovals,
				snapshot.turn.toolStates,
			),
		[
			snapshot.turn.messages,
			snapshot.turn.pendingApprovals,
			snapshot.turn.toolStates,
		],
	);
	const timestamps = useMemo(
		() => toolMessageTimestamps(snapshot.turn.messages),
		[snapshot.turn.messages],
	);
	if (!snapshot.isReady) {
		return (
			<div className="p-6">
				{snapshot.isLoading ? (
					<output className="flex items-center gap-2">
						<Spinner aria-hidden="true" />
						Opening Assistant…
					</output>
				) : (
					<Alert variant="destructive">
						<AlertDescription>
							{snapshot.error?.message ??
								"Assistant is unavailable."}
						</AlertDescription>
						<Button
							type="button"
							variant="outline"
							className="mt-3"
							onClick={() => void session.initialize()}
						>
							Retry connection
						</Button>
					</Alert>
				)}
			</div>
		);
	}
	const insight = session.insight;
	return (
		<InsightContext.Provider
			value={{
				isInitialized: insight.isInitialized,
				isReady: insight.isReady,
				isAuthorized: insight.isAuthorized,
				error: insight.error,
				system: insight.system,
				insightId: insight.insightId,
				actions: insight.actions,
			}}
		>
			<ToolWorkbenchProvider
				roomId={snapshot.association?.roomId ?? ""}
				insightId={insight.insightId}
				tools={tools}
				toolCreatedAt={timestamps}
				pendingApprovals={snapshot.turn.pendingApprovals}
				onApproveTool={session.approve}
				onRejectTool={session.reject}
			>
				<ThreadAssistantView
					{...props}
					session={session}
					snapshot={snapshot}
				/>
			</ToolWorkbenchProvider>
		</InsightContext.Provider>
	);
}
