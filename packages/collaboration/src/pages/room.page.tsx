import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { AgentRunSnapshot, PendingAgentAction } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { useAgent } from "@/app/agent.context";
import { useMain } from "@/app/main.context";
import { useRoom } from "@/app/room.context";
import { EmptyView } from "@/components/common/empty-view";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import type { ConversationMessage } from "@/features/messages/types/message";
import {
	messageFromRunItems,
	optimisticUserMessage,
	threadFromMessages,
} from "@/features/messages/utils/thread-items";
import { isLiveRun, listRoomRuns } from "@/features/rooms/api/list-room-runs";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { useAgentRun } from "@/features/rooms/api/use-agent-run";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import { useRoomModelSelection } from "@/features/rooms/api/use-room-model-selection";
import { useRoomStore } from "@/features/rooms/api/use-room-store";
import { RoomView } from "@/features/rooms/components/room-view";
import type { ComposerSubmission } from "@/features/rooms/types/room";
import {
	pendingSession,
	sessionStatusFromRun,
} from "@/features/rooms/utils/session-from-room";
import { toError } from "@/lib/pixel";
import { agentSettingsPath } from "@/lib/workspace-paths";

/**
 * One room's conversation.
 *
 * Owns the room's transcript — the persisted history from `GetRoomMessages` plus
 * the live run's items — and turns each composer submission into a `RunAgent`
 * run. On entry it also rejoins any run still in flight, since a run keeps going
 * server-side while the page is away.
 */
export function RoomPage() {
	const { agent } = useAgent();
	const { openRoomsList } = useRoom();
	const workspace = useMain();
	const { actions, insightId } = useInsight();
	const navigate = useNavigate();
	const { agentId = "", roomId } = useParams();
	const { setSessions, updateRoom } = workspace;

	const [history, setHistory] = useState<ConversationMessage[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [sentMessage, setSentMessage] = useState<ConversationMessage | null>(
		null,
	);
	const [historyError, setHistoryError] = useState<Error | null>(null);

	const { room } = useRoomStore(insightId, roomId ?? "");
	const modelSelection = useRoomModelSelection(
		roomId ?? "",
		room,
		agent.config_json?.model_id,
	);
	const { modelId } = modelSelection;
	const modelLookup = useRoomModel(modelId);
	const modelName =
		modelSelection.selectedEngine?.engine_display_name ||
		modelSelection.selectedEngine?.engine_name ||
		modelLookup.engine?.engine_display_name ||
		modelLookup.engine?.engine_name ||
		(modelLookup.isLoading ? "Loading model…" : modelId || "Select model");

	const loadHistory = useCallback(async () => {
		if (!roomId || !room) return null;
		try {
			const messages = await getRoomMessages(room);
			const nextHistory = threadFromMessages(messages);
			setHistory(nextHistory);
			setHistoryError(null);
			return nextHistory;
		} catch (cause) {
			setHistoryError(toError(cause));
			return null;
		} finally {
			setIsLoadingHistory(false);
		}
	}, [room, roomId]);

	useEffect(() => {
		setHistory([]);
		setSentMessage(null);
		setIsLoadingHistory(true);
		void loadHistory();
	}, [loadHistory]);

	// Lets `handleSettled` reset the run without depending on the hook it configures.
	const resetRun = useRef<() => void>(() => undefined);

	const handleSettled = useCallback(
		async (snapshot: AgentRunSnapshot, runRoomId: string) => {
			// A run can settle after the user has moved to another room. Everything
			// below writes into the CURRENT room, so ignore a stale one.
			if (runRoomId !== roomId) return;

			// Only hand the turn back to the reloaded history once that reload
			// actually succeeded — otherwise clearing the live items and the
			// optimistic message would erase the answer the user just received.
			const reloaded = await loadHistory();
			if (
				reloaded &&
				snapshot.inputMessageId &&
				reloaded.some(
					(message) => message.id === snapshot.inputMessageId,
				)
			) {
				setSentMessage(null);
			}

			// A failed or cancelled run may never receive a final persisted message.
			// Keep its streamed text/tools visible unless history proves the final
			// response is durable, so stopping or losing a run never erases progress.
			if (
				reloaded &&
				snapshot.finalOutputMessageId &&
				reloaded.some(
					(message) => message.id === snapshot.finalOutputMessageId,
				)
			) {
				resetRun.current();
			}
			updateRoom(roomId, {
				updatedAt: new Date().toISOString(),
				status: sessionStatusFromRun(snapshot.status),
				preview: snapshot.finalText?.slice(0, 120) ?? "",
			});
		},
		[loadHistory, roomId, updateRoom],
	);

	const run = useAgentRun({
		insightId,
		roomId: roomId ?? "",
		agentId,
		room,
		engine: modelId || undefined,
		onSettled: handleSettled,
	});
	resetRun.current = run.reset;

	// A run keeps going server-side while the page is away, so on entering a room
	// look for one still in flight and rejoin its stream rather than showing a
	// finished-looking room that never updates.
	const { reattach } = run;
	useEffect(() => {
		if (!roomId) return;
		let cancelled = false;

		listRoomRuns(actions, roomId)
			.then((runs) => {
				if (cancelled) return;
				const live = runs.find(isLiveRun);
				if (live) {
					reattach(live.runId);
					// The room list reports every room as "Ready"; correct this one now
					// that its real run status is known.
					updateRoom(roomId, {
						status: sessionStatusFromRun(
							(live.status ?? "").toUpperCase() as Parameters<
								typeof sessionStatusFromRun
							>[0],
						),
					});
				}
			})
			.catch(() => {
				// Not being able to list runs is not worth interrupting the room for;
				// the transcript still renders from history.
			});

		return () => {
			cancelled = true;
		};
	}, [actions, reattach, roomId, updateRoom]);

	const { send } = run;
	const handleSend = useCallback(
		async (submission: ComposerSubmission) => {
			setSentMessage(
				optimisticUserMessage(submission.text, submission.files),
			);
			try {
				await send(submission);
			} catch (cause) {
				setSentMessage(null);
				throw toError(cause);
			}
		},
		[send],
	);

	const handleModelChange = useCallback(
		async (engine: Engine) => {
			if (run.isRunning) return;
			try {
				await modelSelection.selectModel(engine);
			} catch (cause) {
				toast.error(
					`The model could not be changed. ${toError(cause).message}`,
				);
			}
		},
		[modelSelection.selectModel, run.isRunning],
	);

	const handleOptimizePrompt = useCallback(
		(draft: string, instructions: string) =>
			optimizePrompt(actions, {
				modelId,
				draft,
				instructions,
			}),
		[actions, modelId],
	);

	const { decide } = run;
	const handleDecide = useCallback(
		async (
			action: PendingAgentAction,
			decision: "submit" | "reject" | "respond",
			paramValues?: Record<string, unknown>,
		) => {
			await decide(action, decision, paramValues);
		},
		[decide],
	);

	useEffect(() => {
		if (!roomId) return;
		setSessions((items) =>
			items.some((session) => session.id === roomId && session.unread)
				? items.map((session) =>
						session.id === roomId
							? { ...session, unread: false }
							: session,
					)
				: items,
		);
	}, [roomId, setSessions]);

	if (!roomId) {
		return (
			<EmptyView title="Room not found">
				This room is unavailable for {agent.name}.
			</EmptyView>
		);
	}

	// A room created in this session is not listed by GetWorkspaceRooms until its
	// first message exists, so list membership cannot gate the room view — the
	// transcript loads from the room id either way.
	const isListed = workspace.sessions.some(
		(session) => session.id === roomId && session.agentId === agentId,
	);
	// RoomView looks the room up in this list, so an unlisted room is added here
	// rather than rendering a "not found" for a room that genuinely exists.
	const sessions = isListed
		? workspace.sessions
		: [pendingSession(roomId, agentId, "New room"), ...workspace.sessions];

	const liveMessage = messageFromRunItems({
		items: run.items,
		itemPhases: run.itemPhases,
		pendingActions: run.pendingActions,
		status: run.status,
		progress: run.progress,
		hasStreamGap: run.hasStreamGap,
	});
	const thread: ConversationMessage[] = [
		...history,
		...(sentMessage ? [sentMessage] : []),
		...(liveMessage ? [liveMessage] : []),
	];

	return (
		<RoomView
			agent={agent}
			sessions={sessions}
			agentId={agentId}
			sessionId={roomId}
			thread={thread}
			isSending={run.isSubmitting}
			isRunning={run.isRunning}
			isCancelling={run.isCancelling}
			isLoadingHistory={isLoadingHistory}
			runError={run.runError}
			transportError={historyError ?? run.transportError}
			pendingActions={run.pendingActions}
			modelId={modelId}
			modelName={modelName}
			isModelSaving={modelSelection.isSaving || !room}
			modelError={modelLookup.error}
			roomInstructions={
				room?.options.instructions || agent.system_prompt || ""
			}
			onSendMessage={handleSend}
			onModelChange={handleModelChange}
			onOptimizePrompt={handleOptimizePrompt}
			onCancelRun={run.cancel}
			onDecideAction={handleDecide}
			onConfigure={(id) => navigate(agentSettingsPath(id))}
			onNewRoom={workspace.newRoom}
			onOpenRooms={openRoomsList}
		/>
	);
}
