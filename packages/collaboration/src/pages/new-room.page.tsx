import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { useAgent } from "@/app/agent.context";
import { useMain } from "@/app/main.context";
import { useRoom } from "@/app/room.context";
import type { ConversationToolStates } from "@/features/messages/types/message";
import { createRoom } from "@/features/rooms/api/create-room";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { submitAgentTurn } from "@/features/rooms/api/use-agent-turn";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import { RoomView } from "@/features/rooms/components/room-view";
import type {
	ComposerSubmission,
	PendingToolApproval,
} from "@/features/rooms/types/room";
import { pendingSession } from "@/features/rooms/utils/session-from-room";
import {
	agentSettingsPath,
	draftRoomPath,
	roomPath,
} from "@/lib/workspace-paths";

const EMPTY_TOOL_STATES: ConversationToolStates = {};

async function rejectDraftApproval(
	_approval: PendingToolApproval,
): Promise<void> {
	throw new Error("A new conversation has no tool approvals yet.");
}

async function approveDraftTool(
	_approval: PendingToolApproval,
	_argumentsValue: Record<string, unknown>,
): Promise<void> {
	throw new Error("A new conversation has no tool approvals yet.");
}

async function cancelDraftTurn(): Promise<void> {
	return undefined;
}

/** Unsaved room composer; the backend room is created by its first submission. */
export function NewRoomPage() {
	const { agent } = useAgent();
	const workspace = useMain();
	const { openRoomsList } = useRoom();
	const { actions, insightId } = useInsight();
	const navigate = useNavigate();
	const { agentId = "", draftId = "" } = useParams();
	const [searchParams] = useSearchParams();
	const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null);
	const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
	const [isStarting, setIsStarting] = useState(false);
	const createdRoomIdRef = useRef<string | null>(null);
	const isRoomReadyRef = useRef(false);
	const startingRef = useRef(false);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const modelId =
		selectedEngine?.engine_id ||
		searchParams.get("model") ||
		agent.config_json?.model_id ||
		"";
	const modelLookup = useRoomModel(modelId);
	const modelName =
		selectedEngine?.engine_display_name ||
		selectedEngine?.engine_name ||
		modelLookup.engine?.engine_display_name ||
		modelLookup.engine?.engine_name ||
		(modelLookup.isLoading ? "Loading model…" : modelId || "Select model");
	const session = useMemo(
		() => pendingSession(draftId, agentId, "New session", modelId),
		[agentId, draftId, modelId],
	);

	const handleModelChange = useCallback(
		async (engine: Engine) => {
			if (createdRoomId || isStarting) return;
			setSelectedEngine(engine);
			navigate(draftRoomPath(agentId, draftId, engine.engine_id), {
				replace: true,
			});
		},
		[agentId, createdRoomId, draftId, isStarting, navigate],
	);

	const handleOptimizePrompt = useCallback(
		(draft: string, instructions: string) =>
			optimizePrompt(actions, { modelId, draft, instructions }),
		[actions, modelId],
	);

	const handleSend = useCallback(
		async (submission: ComposerSubmission) => {
			if (startingRef.current) {
				throw new Error("This conversation is already being started.");
			}
			startingRef.current = true;
			setIsStarting(true);
			try {
				let roomId = createdRoomIdRef.current;
				if (!isRoomReadyRef.current) {
					roomId = await createRoom(
						actions,
						insightId,
						{
							workspaceId: agentId,
							workspaceName: agent.name,
							instructions: agent.system_prompt,
							modelId,
						},
						{
							roomId: roomId ?? undefined,
							onCreated: (allocatedRoomId) => {
								createdRoomIdRef.current = allocatedRoomId;
								if (mountedRef.current) {
									setCreatedRoomId(allocatedRoomId);
								}
							},
						},
					);
					createdRoomIdRef.current = roomId;
					if (mountedRef.current) setCreatedRoomId(roomId);
					isRoomReadyRef.current = true;
					workspace.addPendingRoom(
						pendingSession(roomId, agentId, "New session", modelId),
					);
				}
				if (!roomId) {
					throw new Error("The conversation could not be created.");
				}

				await submitAgentTurn(
					{
						insightId,
						roomId,
						agentId,
						engine: modelId,
						maxTurns: agent.config_json?.budgets?.max_turns ?? 40,
						maxReflections:
							agent.config_json?.budgets?.max_reflections,
					},
					submission,
				);
				workspace.trackGeneratedRoomName(agentId, roomId);
				if (mountedRef.current) {
					navigate(roomPath(agentId, roomId), { replace: true });
				}
			} finally {
				startingRef.current = false;
				if (mountedRef.current) setIsStarting(false);
			}
		},
		[
			actions,
			agent.config_json?.budgets?.max_reflections,
			agent.config_json?.budgets?.max_turns,
			agent.name,
			agent.system_prompt,
			agentId,
			insightId,
			modelId,
			navigate,
			workspace,
		],
	);

	return (
		<RoomView
			agent={agent}
			insightId={insightId}
			sessions={[session]}
			agentId={agentId}
			sessionId={draftId}
			thread={[]}
			toolStates={EMPTY_TOOL_STATES}
			isSending={isStarting}
			isRunning={false}
			isCancelling={false}
			isLoadingHistory={false}
			turnError={null}
			transportError={null}
			pendingApprovals={[]}
			phase={null}
			modelId={modelId}
			modelName={modelName}
			isModelSaving={false}
			isModelLocked={Boolean(createdRoomId)}
			showToolWorkbench={false}
			modelError={modelLookup.error}
			roomInstructions={agent.system_prompt || ""}
			onSendMessage={handleSend}
			onModelChange={handleModelChange}
			onOptimizePrompt={handleOptimizePrompt}
			onCancelTurn={cancelDraftTurn}
			onApproveTool={approveDraftTool}
			onRejectTool={rejectDraftApproval}
			onConfigure={(id) => navigate(agentSettingsPath(id))}
			onNewRoom={workspace.newRoom}
			onOpenRooms={openRoomsList}
		/>
	);
}
