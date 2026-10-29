import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { H4, P, toast } from "@semoss/ui/next";
import {
	type AgentRunRoom,
	buildAgentRunRoomsPixel,
	closeAgentRoom,
	getAgentRun,
	getAgentRunModelInfo,
	getAllAgentRunsForRoom,
	getClaudeCodeTranscript,
	getSubagentRuns,
} from "@/api/agent-runs";
import {
	AgentRoomDetail,
	type AgentRoomSource,
} from "@/features/agent-activity/agent-room-detail";
import { AgentRoomList } from "@/features/agent-activity/agent-room-list";
import { agentRoomKey } from "@/features/agent-activity/agent-room-table";
import { useAgentRoomQuery } from "@/features/agent-activity/use-agent-room-query";
import { useAgentRooms } from "@/features/agent-activity/use-agent-rooms";
import { useOpenAgentRoom } from "@/features/agent-activity/use-open-agent-room";
import { useProject } from "@/hooks/use-project";

/** The user's own reads and close of their rooms, matched by their login */
const OWN_ROOM_SOURCE: AgentRoomSource = {
	fetchRoomRuns: (roomId) => getAllAgentRunsForRoom(roomId),
	fetchRunDetail: getAgentRun,
	fetchSubagentRuns: getSubagentRuns,
	fetchClaudeCodeTranscript: getClaudeCodeTranscript,
	fetchEngineInfo: getAgentRunModelInfo,
	closeRoom: (roomId) => closeAgentRoom(roomId),
};

/**
 * A room opened from a link, before its runs are read. The user is the
 * signed in one, so the room's reads need only its id.
 *
 * @param roomId - The room.
 * @returns The room, with its name and counts left for its runs to give.
 */
const linkedRoom = (roomId: string): AgentRunRoom => ({
	roomId,
	roomName: null,
	userId: "",
	userName: null,
	userEmail: null,
	userType: null,
	agentId: null,
	agentName: null,
	runCount: 0,
	activeRunCount: 0,
	failedRunCount: 0,
	isClosed: false,
	firstRunAt: null,
	lastActivityAt: null,
});

/**
 * The "Agent Activity" tab of the agent workspace settings panel: the user's
 * own rooms with this agent, most recently active first, searched by room name
 * or id and filtered by status, as the admin Agent Runs page lists everyone's.
 * Opening a room shows its runs, subagents and tool calls as a graph, with
 * Export and Close Room. A link with `roomId`, and `runId` for one run, opens
 * that room. A room that cannot be opened, such as one holding no runs of this
 * agent, goes back to the list and says why.
 */
export const AgentActivityPage = () => {
	const { project } = useProject();
	const agentId = project.project_id;
	const [searchParams] = useSearchParams();
	const targetRoomId = searchParams.get("roomId")?.trim() || null;
	const targetRunId = searchParams.get("runId")?.trim() || null;
	const handledLink = useRef<string | null>(null);
	const query = useAgentRoomQuery();
	const roomPage = useAgentRooms(
		buildAgentRunRoomsPixel(
			agentId,
			query.appliedSearch,
			query.status,
			query.page,
		),
	);
	const { rootRef, openRoom, open, back, markClosed } = useOpenAgentRoom();

	useEffect(() => {
		if (!targetRoomId) {
			return;
		}
		const link = `${targetRoomId}:${targetRunId ?? ""}`;
		if (handledLink.current === link) {
			return;
		}
		handledLink.current = link;
		open(linkedRoom(targetRoomId), targetRunId);
	}, [targetRoomId, targetRunId, open]);

	if (openRoom) {
		const { room, runId } = openRoom;
		return (
			<div ref={rootRef} className="flex w-full min-w-0 flex-col">
				<AgentRoomDetail
					key={`${agentRoomKey(room)}:${runId ?? ""}`}
					room={room}
					runId={runId}
					agentId={agentId}
					source={OWN_ROOM_SOURCE}
					exportDetails={[
						{
							label: "Agent",
							value: `${project.project_name} (${agentId})`,
						},
					]}
					ownerLabel={null}
					onBack={back}
					onClosed={() => {
						markClosed();
						roomPage.refresh();
					}}
					onLoadFailed={(message) => {
						back();
						toast.error(`Unable to open the room: ${message}`);
					}}
				/>
			</div>
		);
	}

	return (
		<div ref={rootRef} className="flex w-full min-w-0 flex-col">
			<div>
				<H4>Agent Activity</H4>
				<P className="text-muted-foreground text-sm">
					Your rooms with this agent, most recently active first.
				</P>
			</div>
			<AgentRoomList
				label="Agent activity"
				query={query}
				roomPage={roomPage}
				emptyTitle="No activity yet for this agent"
				emptyDescription="Each conversation you have with this agent will appear here."
				onOpen={(room) => open(room)}
			/>
		</div>
	);
};
