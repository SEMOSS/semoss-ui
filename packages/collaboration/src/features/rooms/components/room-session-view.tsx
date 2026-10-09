import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { useDelegationStatus } from "@/features/delegations/api/use-delegation-status";
import { DelegationResponsePanel } from "@/features/delegations/components/delegation-response-panel";
import { getRoomEmailContext } from "@/features/room-email/room-email-store";
import {
	presentThreadApprovals,
	presentThreadMessages,
} from "@/features/thread-assistant/thread-context";
import { newRoomPath } from "@/lib/workspace-paths";
import { optimizePrompt } from "../api/optimize-prompt";
import type { RoomSession, RoomSessionSnapshot } from "../room-session";
import { pendingSession } from "../utils/session-from-room";
import { RoomView } from "./room-view";

const ASSISTANT: AgentConfiguration = {
	name: "Assistant",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};

/** Adapt the shared room state to the standard conversation and tool workbench. */
export function RoomSessionView({
	session,
	snapshot,
}: {
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
}) {
	const navigate = useNavigate();
	const { turn } = snapshot;
	const agent = snapshot.agent ?? ASSISTANT;
	const handleAnswered = useCallback(() => {
		void session.reconnect();
	}, [session]);
	const applyDelegations = useDelegationStatus(
		session.insight.insightId,
		turn.messages,
		handleAnswered,
	);
	const thread = useMemo(
		() => applyDelegations(presentThreadMessages(turn.messages)),
		[applyDelegations, turn.messages],
	);
	const delegationActionId = snapshot.options?.delegation_action_id;
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col">
			{typeof delegationActionId === "string" && (
				<DelegationResponsePanel
					actionId={delegationActionId}
					refreshKey={thread.length}
				/>
			)}
			<RoomView
				roomSession={session}
				roomSnapshot={snapshot}
				agent={agent}
				insightId={session.insight.insightId}
				sessions={[
					pendingSession(
						snapshot.roomId,
						snapshot.settings.agentId,
						snapshot.title,
						snapshot.modelId,
					),
				]}
				agentId={snapshot.settings.agentId}
				sessionId={snapshot.roomId}
				thread={thread}
				toolStates={turn.toolStates}
				isSending={
					snapshot.isPreparing ||
					turn.isSubmitting ||
					turn.isRestoring
				}
				isRunning={turn.isRunning}
				isCancelling={turn.isCancelling}
				isLoadingHistory={snapshot.isLoading || turn.isRestoring}
				turnError={turn.turnError}
				transportError={snapshot.error ?? turn.transportError}
				pendingApprovals={presentThreadApprovals(turn.pendingApprovals)}
				phase={turn.phase}
				modelId={snapshot.modelId}
				modelName={snapshot.modelName}
				isModelSaving={
					snapshot.isSavingSettings || snapshot.isLoadingModel
				}
				modelError={
					snapshot.modelError ? new Error(snapshot.modelError) : null
				}
				roomInstructions={
					snapshot.settings.instructions || agent.system_prompt
				}
				roomSettings={snapshot.settings}
				onSendMessage={(submission) =>
					session.send(submission, getRoomEmailContext(session))
				}
				onModelChange={(engine) =>
					session.selectModel(
						engine.engine_id,
						engine.engine_display_name || engine.engine_name,
					)
				}
				onSaveRoomSettings={(settings) =>
					session.saveSettings(snapshot.title, {
						...snapshot.settings,
						...settings,
						modelId: settings.modelId ?? snapshot.modelId,
						temperature: settings.temperature ?? null,
					})
				}
				onOptimizePrompt={(draft, instructions) =>
					optimizePrompt(session.insight.actions, {
						modelId: snapshot.modelId,
						draft,
						instructions,
					})
				}
				onCancelTurn={session.cancel}
				onReconnect={session.reconnect}
				onApproveTool={session.approve}
				onRejectTool={session.reject}
				onNewRoom={(agentId) => void navigate(newRoomPath(agentId))}
				onOpenRooms={() => void navigate("/work")}
			/>
		</div>
	);
}
