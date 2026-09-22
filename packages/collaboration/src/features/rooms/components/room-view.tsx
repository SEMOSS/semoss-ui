import { Menu, Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@semoss/ui/next";
import { EmptyView } from "@/components/common/empty-view";
import { toolsFromMessages } from "@/features/messages/utils/thread-items";
import type { RoomViewProps } from "@/features/rooms/types/room";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import { RoomWorkspace } from "./room-workspace";

export function RoomView({
	agent,
	sessions,
	agentId,
	sessionId,
	thread,
	isSending,
	isRunning,
	isCancelling,
	isLoadingHistory,
	runError,
	transportError,
	pendingActions,
	modelId,
	modelName,
	isModelSaving,
	modelError,
	roomInstructions,
	onSendMessage,
	onModelChange,
	onOptimizePrompt,
	onCancelRun,
	onDecideAction,
	onConfigure,
	onNewRoom,
	onOpenRooms,
}: RoomViewProps) {
	const session = sessions.find((candidate) => candidate.id === sessionId);
	const tools = useMemo(
		() => toolsFromMessages(thread, pendingActions),
		[thread, pendingActions],
	);

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden">
			{session ? (
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="flex h-11 shrink-0 items-center gap-2 border-b px-3 md:hidden">
						<Button
							type="button"
							aria-label="Choose agent or room"
							variant="ghost"
							size="icon-sm"
							onClick={onOpenRooms}
						>
							<Menu aria-hidden="true" />
						</Button>
						<span className="text-muted-foreground text-xs">
							Room workspace
						</span>
					</div>
					<ToolWorkbenchProvider
						key={sessionId}
						roomId={sessionId}
						tools={tools}
						pendingActions={pendingActions}
						onDecideAction={onDecideAction}
					>
						<RoomWorkspace
							agent={agent}
							agentId={agentId}
							session={session}
							thread={thread}
							isSending={isSending}
							isRunning={isRunning}
							isCancelling={isCancelling}
							isLoadingHistory={isLoadingHistory}
							runError={runError}
							transportError={transportError}
							pendingActions={pendingActions}
							modelId={modelId}
							modelName={modelName}
							isModelSaving={isModelSaving}
							modelError={modelError}
							roomInstructions={roomInstructions}
							onSendMessage={onSendMessage}
							onModelChange={onModelChange}
							onOptimizePrompt={onOptimizePrompt}
							onCancelRun={onCancelRun}
							onConfigure={onConfigure}
							onNewRoom={onNewRoom}
						/>
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
