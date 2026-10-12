import { Menu, Plus } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button, z } from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import { EmptyView } from "@/components/common/empty-view";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { toolMessageTimestamps } from "@/features/messages/utils/message-metadata";
import { toolsFromMessages } from "@/features/messages/utils/thread-items";
import { ROOM_CONNECTOR_COMPONENTS } from "@/features/room-connectors/room-connectors.components";
import { createRoomConnectorLayout } from "@/features/room-connectors/room-connectors.constants";
import { RoomConnectorsProvider } from "@/features/room-connectors/room-connectors-provider";
import { ROOM_EMAIL_PANEL_COMPONENTS } from "@/features/room-email/room-email-panel";
import { RoomEmailProvider } from "@/features/room-email/room-email-provider";
import { ROOM_EMAIL_SOURCE_PANEL_COMPONENTS } from "@/features/room-email/room-email-source-panel";
import { ROOM_TEAMS_SOURCE_PANEL_COMPONENTS } from "@/features/room-email/room-teams-source-panel";
import type { RoomViewProps } from "@/features/rooms/types/room";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import { TOOL_WORKBENCH_COMPONENTS } from "@/features/tools/tool-workbench.components";
import { ROOM_SETTINGS_PANEL_COMPONENTS } from "./room-settings-panel";
import { RoomSettingsPanelContext } from "./room-settings-panel.context";
import { RoomWorkspace } from "./room-workspace";

const ROOM_COMPONENTS = {
	...TOOL_WORKBENCH_COMPONENTS,
	...ROOM_CONNECTOR_COMPONENTS,
	...ROOM_EMAIL_PANEL_COMPONENTS,
	...ROOM_EMAIL_SOURCE_PANEL_COMPONENTS,
	...ROOM_TEAMS_SOURCE_PANEL_COMPONENTS,
	...ROOM_SETTINGS_PANEL_COMPONENTS,
};

const completedGoalResultSchema = z.object({
	changes: z.array(z.string()),
	topic: z.object({ id: z.string().min(1) }),
});

export function RoomView({
	roomSession,
	roomSnapshot,
	agent,
	insightId,
	sessions,
	agentId,
	sessionId,
	thread,
	toolStates,
	isSending,
	isRunning,
	isCancelling,
	isLoadingHistory,
	turnError,
	transportError,
	pendingApprovals,
	phase,
	modelId,
	modelName,
	isModelSaving,
	isModelLocked = false,
	showToolWorkbench = true,
	modelError,
	roomInstructions,
	roomSettings,
	onSendMessage,
	onModelChange,
	onSaveRoomSettings,
	onOptimizePrompt,
	onCancelTurn,
	onReconnect,
	onApproveTool,
	onRejectTool,
	onNewRoom,
	onOpenRooms,
}: RoomViewProps) {
	const updates = useWorkUpdates();
	const handleApproveTool: RoomViewProps["onApproveTool"] = async (
		approval,
		parameters,
	) => {
		await onApproveTool(approval, parameters);
		if (
			approval.toolName !== "EditTopic" ||
			typeof parameters.completeGoalId !== "string"
		)
			return;
		const goalId = parameters.completeGoalId.trim();
		if (!goalId) return;
		const topicId =
			typeof parameters.topicId === "string"
				? parameters.topicId
				: undefined;
		const topic =
			typeof parameters.name === "string" && parameters.name.trim()
				? parameters.name
				: typeof parameters.topic === "string"
					? parameters.topic
					: undefined;
		if (topicId || topic)
			updates?.refreshTopicGoal({ topicId, topic }, goalId);
	};
	const session = sessions.find((candidate) => candidate.id === sessionId);
	const { tools, toolCreatedAt } = useMemo(
		() => ({
			tools: toolsFromMessages(thread, pendingApprovals, toolStates),
			toolCreatedAt: toolMessageTimestamps(thread),
		}),
		[thread, pendingApprovals, toolStates],
	);
	const refreshedGoals = useRef(new Set<string>());
	const refreshTopicGoal = updates?.refreshTopicGoal;
	useEffect(() => {
		if (!refreshTopicGoal) return;
		for (const tool of Object.values(tools)) {
			const key = `${sessionId}:${tool.id}`;
			if (
				tool.name !== "CompleteGoal" ||
				tool.status !== "COMPLETED" ||
				tool.error ||
				refreshedGoals.current.has(key)
			)
				continue;
			const result = completedGoalResultSchema.safeParse(
				tryParseJson(tool.output ?? ""),
			);
			const goalId = tool.arguments.goalId;
			if (
				!result.success ||
				!result.data.changes.includes("goal completed") ||
				typeof goalId !== "string" ||
				!goalId.trim()
			)
				continue;
			refreshedGoals.current.add(key);
			refreshTopicGoal({ topicId: result.data.topic.id }, goalId.trim());
		}
	}, [refreshTopicGoal, sessionId, tools]);

	const workspace = session ? (
		<RoomWorkspace
			roomSession={roomSession}
			roomSnapshot={roomSnapshot}
			agent={agent}
			session={session}
			thread={thread}
			isSending={isSending}
			isRunning={isRunning}
			isCancelling={isCancelling}
			isLoadingHistory={isLoadingHistory}
			turnError={turnError}
			transportError={transportError}
			pendingApprovals={pendingApprovals}
			phase={phase}
			modelId={modelId}
			modelName={modelName}
			isModelSaving={isModelSaving}
			isModelLocked={isModelLocked}
			showToolWorkbench={showToolWorkbench}
			modelError={modelError}
			roomInstructions={roomInstructions}
			roomSettings={roomSettings}
			onSendMessage={onSendMessage}
			onModelChange={onModelChange}
			onSaveRoomSettings={onSaveRoomSettings}
			onOptimizePrompt={onOptimizePrompt}
			onCancelTurn={onCancelTurn}
			onReconnect={onReconnect}
		/>
	) : null;

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden">
			{session ? (
				<div className="flex min-w-0 flex-1 flex-col">
					<ToolWorkbenchProvider
						key={sessionId}
						autoReveal={false}
						components={ROOM_COMPONENTS}
						createLayout={createRoomConnectorLayout}
						roomId={sessionId}
						insightId={insightId}
						tools={tools}
						toolCreatedAt={toolCreatedAt}
						pendingApprovals={pendingApprovals}
						onApproveTool={handleApproveTool}
						onRejectTool={onRejectTool}
					>
						<RoomConnectorsProvider session={roomSession}>
							<RoomSettingsPanelContext.Provider
								value={{
									agentName: agent.name,
									agent,
									modelId,
									modelName,
									settings: roomSettings,
									inheritedMcp: agent.mcp,
									isReadOnly:
										isSending || isRunning || isModelSaving,
									isModelLocked,
									onSave: onSaveRoomSettings,
								}}
							>
								{roomSession && roomSnapshot ? (
									<RoomEmailProvider
										session={roomSession}
										roomId={sessionId}
										source={roomSnapshot.source}
										turn={roomSnapshot.turn}
										isReady={roomSnapshot.isReady}
									>
										{workspace}
									</RoomEmailProvider>
								) : (
									workspace
								)}
							</RoomSettingsPanelContext.Provider>
						</RoomConnectorsProvider>
					</ToolWorkbenchProvider>
				</div>
			) : (
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="border-b p-3 md:hidden">
						<Button
							type="button"
							variant="outline"
							onClick={onOpenRooms}
						>
							<Menu aria-hidden="true" />
							Agents & sessions
						</Button>
					</div>
					<div className="m-auto">
						<EmptyView
							title={`Start working with ${agent.name}`}
							action={
								<Button
									type="button"
									onClick={() => onNewRoom(agentId)}
								>
									<Plus aria-hidden="true" />
									New room
								</Button>
							}
						>
							Select a session or start with a fresh topic.
						</EmptyView>
					</div>
				</div>
			)}
		</div>
	);
}
