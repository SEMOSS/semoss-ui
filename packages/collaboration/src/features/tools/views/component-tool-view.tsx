import { type ReactNode, useContext, useRef, useState } from "react";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import {
	type ResolvedToolView,
	type ToolViewCallStatus,
	ToolViewRenderer,
} from "@semoss/shared";
import { Skeleton, toast } from "@semoss/ui/next";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import type { ConversationTool } from "@/features/messages/types/message";
import { RoomConnectorsContext } from "@/features/room-connectors/room-connectors.context";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { useToolWorkbench } from "../tool-workbench.context";

interface ComponentToolViewProps {
	/** The original call and its resolved native view. */
	tool: ConversationTool;
	view: ResolvedToolView;
	action?: PendingToolApproval;
	fallback: ReactNode;
}

const STATUSES: Record<ConversationTool["status"], ToolViewCallStatus> = {
	QUEUED: "pending",
	RUNNING: "running",
	INPUT_REQUIRED: "pending",
	COMPLETED: "succeeded",
	FAILED: "failed",
	REJECTED: "declined",
	CANCELLED: "declined",
};

/** Bridge native connector and Collaboration views to the room's existing approval controller. */
export function ComponentToolView({
	tool,
	view,
	action,
	fallback,
}: ComponentToolViewProps) {
	const { onApproveTool, onRejectTool, store, insightId } =
		useToolWorkbench();
	const connectors = useContext(RoomConnectorsContext);
	const session = connectors?.session;
	const refreshFiles = (path: string): void => {
		store.getState().events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
			scope: getFilePanelScope({
				type: "INSIGHT",
				insightId: session?.insight.insightId ?? insightId,
			}),
			paths: [path],
		});
	};
	const [decision, setDecision] = useState<
		"approved" | "declined" | "responded" | null
	>(null);
	const deciding = useRef(false);
	const decide = async (
		kind: NonNullable<typeof decision>,
		run: (approval: PendingToolApproval) => Promise<void>,
	): Promise<void> => {
		if (!action || action.isDeciding || deciding.current || decision)
			throw new Error(
				"This action is no longer available for a decision.",
			);
		deciding.current = true;
		try {
			await run(action);
			setDecision(kind);
		} finally {
			deciding.current = false;
		}
	};
	const functionName =
		typeof tool.metadata?.SMSS_FUNCTION_NAME === "string"
			? tool.metadata.SMSS_FUNCTION_NAME
			: tool.name;
	return (
		<ToolViewRenderer
			view={view}
			call={{
				id: tool.id,
				functionName,
				arguments: action?.arguments ?? tool.arguments,
				result: tool.error ?? tool.output,
				status:
					decision === "declined"
						? "declined"
						: decision && tool.status === "INPUT_REQUIRED"
							? "running"
							: STATUSES[tool.status],
			}}
			mode={action && !decision ? "approval" : "result"}
			onApprove={(argumentsValue) =>
				decide("approved", (approval) =>
					onApproveTool(
						approval,
						argumentsValue ?? approval.arguments ?? tool.arguments,
					),
				)
			}
			onDecline={() => decide("declined", onRejectTool)}
			onRespond={(outcome) =>
				decide("responded", (approval) =>
					onApproveTool(
						{ ...approval, requiresResponse: true },
						{ ...outcome },
					),
				)
			}
			host={{
				saveTargetName: "Chat files",
				prepareSave: session
					? async () => {
							const release = session.retain();
							try {
								await session.create(
									session.getSnapshot().title,
								);
								return release;
							} catch (error) {
								release();
								throw error;
							}
						}
					: undefined,
				onSaved: (file) => {
					refreshFiles(file.path);
					toast.success(`Saved ${file.name} to chat files`);
				},
				onAddToContext: session
					? (file) => {
							refreshFiles(file.path);
							session.addContextFile({
								fileLocation: file.path,
								fileName: file.name,
							});
							toast.success(`Added ${file.name} to context`);
						}
					: undefined,
				onSignIn:
					view.params.provider === "microsoft"
						? async () => {
								await connectMicrosoft();
								return true;
							}
						: undefined,
			}}
			loading={
				<output className="block p-3">
					<Skeleton className="h-24 w-full" />
					<span className="sr-only">Loading tool view</span>
				</output>
			}
			fallback={fallback}
		/>
	);
}
