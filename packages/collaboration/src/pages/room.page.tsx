import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import { useAgent } from "@/app/agent.context";
import { useMain } from "@/app/main.context";
import { useRoom } from "@/app/room.context";
import { EmptyView } from "@/components/common/empty-view";
import { roomsKey } from "@/features/agents/api/refresh-keys";
import { useDelegationStatus } from "@/features/delegations/api/use-delegation-status";
import { DelegationResponsePanel } from "@/features/delegations/components/delegation-response-panel";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import type { ValidatedRoomMessage } from "@/features/messages/api/message-schemas";
import type { ConversationMessage } from "@/features/messages/types/message";
import {
	mergeToolStates,
	threadFromMessages,
} from "@/features/messages/utils/thread-items";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { useAgentTurn } from "@/features/rooms/api/use-agent-turn";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import { useRoomModelSelection } from "@/features/rooms/api/use-room-model-selection";
import { useRoomStore } from "@/features/rooms/api/use-room-store";
import { RoomView } from "@/features/rooms/components/room-view";
import type {
	ComposerSubmission,
	PendingToolApproval,
	RoomSettings,
} from "@/features/rooms/types/room";
import {
	pendingSession,
	sessionStatusFromPhase,
} from "@/features/rooms/utils/session-from-room";
import { agentSettingsPath } from "@/lib/workspace-paths";

/** One collaboration room's durable transcript and agent harness observer. */
export function RoomPage() {
	const { agent, agentId } = useAgent();
	const { openRoomsList } = useRoom();
	const workspace = useMain();
	const { actions, insightId } = useInsight();
	const navigate = useNavigate();
	const { roomId } = useParams();
	const { setSessions, updateRoom, refresh } = workspace;
	const [history, setHistory] = useState<ConversationMessage[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [historyError, setHistoryError] = useState<Error | null>(null);
	const reconcileRef = useRef<(messages: ValidatedRoomMessage[]) => void>(
		() => undefined,
	);

	const {
		room,
		isLoading: isLoadingRoom,
		error: roomError,
	} = useRoomStore(insightId, roomId ?? "");
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
		if (!roomId) return null;
		try {
			const messages = await getRoomMessages(actions, roomId);
			setHistory(threadFromMessages(messages));
			reconcileRef.current(messages);
			setHistoryError(null);
			return messages;
		} catch (cause) {
			setHistoryError(toError(cause));
			return null;
		} finally {
			setIsLoadingHistory(false);
		}
	}, [actions, roomId]);

	const handleSettled = useCallback(
		async (settledRoomId: string) => {
			if (!roomId || settledRoomId !== roomId) return;
			const messages = await loadHistory();
			if (messages) refresh(roomsKey(agentId));
		},
		[agentId, loadHistory, refresh, roomId],
	);

	const turn = useAgentTurn({
		insightId,
		roomId: roomId ?? "",
		agentId,
		engine: modelId,
		maxTurns: agent.config_json?.budgets?.max_turns ?? 40,
		maxReflections: agent.config_json?.budgets?.max_reflections,
		onSettled: handleSettled,
	});
	reconcileRef.current = turn.reconcileHistory;

	useEffect(() => {
		setHistory([]);
		setIsLoadingHistory(true);
		void loadHistory();
	}, [loadHistory]);

	useEffect(() => {
		if (!roomId) return;
		updateRoom(roomId, { status: sessionStatusFromPhase(turn.phase) });
	}, [roomId, turn.phase, updateRoom]);

	const handleSend = useCallback(
		(submission: ComposerSubmission) => turn.send(submission),
		[turn.send],
	);

	const handleModelChange = useCallback(
		async (engine: Engine) => {
			if (turn.isRunning) return;
			try {
				await modelSelection.selectModel(engine);
				if (roomId) updateRoom(roomId, { modelId: engine.engine_id });
			} catch (cause) {
				toast.error(
					`The model could not be changed. ${toError(cause).message}`,
				);
			}
		},
		[modelSelection.selectModel, roomId, turn.isRunning, updateRoom],
	);

	const handleSaveRoomSettings = useCallback(
		async (settings: RoomSettings) => {
			if (!room) {
				throw new Error("Room settings are still loading.");
			}
			const roomDerivedMcp = room.options.mcp.filter(
				(resource) => resource.fromRoom,
			);
			await room.updateOptions({
				instructions: settings.instructions,
				mcp: [...roomDerivedMcp, ...settings.mcp],
			});
		},
		[room],
	);

	const handleOptimizePrompt = useCallback(
		(draft: string, instructions: string) =>
			optimizePrompt(actions, { modelId, draft, instructions }),
		[actions, modelId],
	);

	const handleApprove = useCallback(
		(
			approval: PendingToolApproval,
			argumentsValue: Record<string, unknown>,
		) => turn.approve(approval, argumentsValue),
		[turn.approve],
	);
	const handleReject = useCallback(
		(approval: PendingToolApproval) => turn.reject(approval),
		[turn.reject],
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

	const thread = useMemo(() => {
		const byId = new Map<string, ConversationMessage>();
		for (const message of [...history, ...turn.messages]) {
			byId.set(message.id, message);
		}
		return mergeToolStates([...byId.values()], turn.toolStates);
	}, [history, turn.messages, turn.toolStates]);

	// A person's answer arrives as history plus, for POST_AND_CONTINUE, a new run.
	const handleDelegationAnswered = useCallback(() => {
		void loadHistory();
		void turn.reconnect();
	}, [loadHistory, turn.reconnect]);
	const applyDelegations = useDelegationStatus(
		insightId,
		thread,
		handleDelegationAnswered,
	);
	const displayThread = useMemo(
		() => applyDelegations(thread),
		[applyDelegations, thread],
	);

	if (!roomId) {
		return (
			<EmptyView title="Room not found">
				This room is unavailable for {agent.name}.
			</EmptyView>
		);
	}

	const isListed = workspace.sessions.some(
		(session) => session.id === roomId && session.agentId === agentId,
	);
	const sessions = isListed
		? workspace.sessions
		: [
				pendingSession(roomId, agentId, "New room", modelId),
				...workspace.sessions,
			];

	const delegationActionId =
		typeof room?.options.delegation_action_id === "string"
			? room.options.delegation_action_id
			: undefined;

	const view = (
		<RoomView
			agent={agent}
			insightId={insightId}
			sessions={sessions}
			agentId={agentId}
			sessionId={roomId}
			thread={displayThread}
			toolStates={turn.toolStates}
			isSending={turn.isSubmitting || turn.isRestoring}
			isRunning={turn.isRunning}
			isCancelling={turn.isCancelling}
			isLoadingHistory={
				isLoadingHistory || isLoadingRoom || turn.isRestoring
			}
			turnError={turn.turnError}
			transportError={historyError ?? roomError ?? turn.transportError}
			pendingApprovals={turn.pendingApprovals}
			phase={turn.phase}
			modelId={modelId}
			modelName={modelName}
			isModelSaving={modelSelection.isSaving || !room}
			modelError={modelLookup.error}
			roomInstructions={
				room?.options.instructions || agent.system_prompt || ""
			}
			roomSettings={{
				instructions: room?.options.instructions ?? "",
				mcp: room?.options.mcp ?? [],
			}}
			onSendMessage={handleSend}
			onModelChange={handleModelChange}
			onSaveRoomSettings={handleSaveRoomSettings}
			onOptimizePrompt={handleOptimizePrompt}
			onCancelTurn={turn.cancel}
			onReconnect={turn.reconnect}
			onApproveTool={handleApprove}
			onRejectTool={handleReject}
			onConfigure={(id) => navigate(agentSettingsPath(id))}
			onNewRoom={workspace.newRoom}
			onOpenRooms={openRoomsList}
		/>
	);
	if (!delegationActionId) return view;
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col">
			<DelegationResponsePanel
				actionId={delegationActionId}
				refreshKey={thread.length}
			/>
			{view}
		</div>
	);
}
