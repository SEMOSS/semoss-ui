import { useState } from "react";
import { PersonIdentity } from "@semoss/shared";
import {
	type AgentRunAgentOption,
	type AgentRunUserOption,
	buildAdminAgentRunRoomsPixel,
	closeAdminAgentRunRoom,
	getAdminAgentRun,
	getAdminAgentRunAgents,
	getAdminAgentRunUsers,
	getAdminAllAgentRunsForRoom,
	getAdminClaudeCodeTranscript,
	getAdminSubagentRuns,
} from "@/api/agent-runs";
import {
	AgentRoomDetail,
	type AgentRoomSource,
} from "@/features/agent-activity/agent-room-detail";
import { AgentRoomDetailLine } from "@/features/agent-activity/agent-room-detail-line";
import { AgentRoomList } from "@/features/agent-activity/agent-room-list";
import { agentRoomKey } from "@/features/agent-activity/agent-room-table";
import { useAgentRoomQuery } from "@/features/agent-activity/use-agent-room-query";
import { useAgentRooms } from "@/features/agent-activity/use-agent-rooms";
import { useOpenAgentRoom } from "@/features/agent-activity/use-open-agent-room";
import { AgentRunFilterSelect } from "./agent-run-filter-select";
import { AGENT_RUN_ROOM_COLUMNS } from "./agent-run-room-columns";
import {
	agentRunRoomExportDetails,
	agentRunRoomUserLabel,
} from "./agent-run-room-labels";
import { agentRunRoomSummaryItems } from "./agent-run-room-summary-items";

/**
 * The admin's reads and close of any user's room. The runs carry their models'
 * names, so no engine metadata is read.
 */
const ADMIN_ROOM_SOURCE: AgentRoomSource = {
	fetchRoomRuns: getAdminAllAgentRunsForRoom,
	fetchRunDetail: getAdminAgentRun,
	fetchSubagentRuns: getAdminSubagentRuns,
	fetchClaudeCodeTranscript: getAdminClaudeCodeTranscript,
	closeRoom: closeAdminAgentRunRoom,
};

/** The agent and user filters, with the names they show */
interface AgentRunsFilters {
	agentId: string;
	agentLabel: string;
	userId: string;
	userType: string;
	userLabel: string;
}

const NO_FILTERS: AgentRunsFilters = {
	agentId: "",
	agentLabel: "",
	userId: "",
	userType: "",
	userLabel: "",
};

/** An agent choice's key */
const agentOptionKey = (agent: AgentRunAgentOption): string => agent.agentId;

/** What an agent choice is called, its id when the catalog has no name */
const agentOptionLabel = (agent: AgentRunAgentOption): string =>
	agent.agentName ?? agent.agentId;

/** A user choice's key: their login type and id, as two logins can share an id */
const userOptionKey = (user: AgentRunUserOption): string =>
	`${user.userType ?? ""}:${user.userId}`;

/** What a user choice is called, their id when they have no name */
const userOptionLabel = (user: AgentRunUserOption): string =>
	user.userName ?? user.userId;

/**
 * The admin Agent Runs page: every user's conversations with agents, most
 * recently active first, searched by room and filtered by agent, user or
 * status. Opening one shows the same graph of its runs, subagents and tool
 * calls its owner sees, read only, from the top of the page; Back returns to
 * the list where it was scrolled.
 */
export const AgentRuns = () => {
	const query = useAgentRoomQuery();
	const [filters, setFilters] = useState<AgentRunsFilters>(NO_FILTERS);
	const roomPage = useAgentRooms(
		buildAdminAgentRunRoomsPixel(
			{
				agentId: filters.agentId,
				userId: filters.userId,
				userType: filters.userType,
				search: query.appliedSearch,
				status: query.status,
			},
			query.page,
		),
	);
	const { rootRef, openRoom, open, back, markClosed } = useOpenAgentRoom();

	const filterBy = (patch: Partial<AgentRunsFilters>) => {
		setFilters((previous) => ({ ...previous, ...patch }));
		query.resetPage();
	};

	if (openRoom) {
		const { room } = openRoom;
		return (
			<div ref={rootRef} className="flex w-full min-w-0 flex-col pb-8">
				<AgentRoomDetail
					key={agentRoomKey(room)}
					room={room}
					source={ADMIN_ROOM_SOURCE}
					summaryItems={agentRunRoomSummaryItems(room)}
					exportDetails={agentRunRoomExportDetails(room)}
					ownerLabel={agentRunRoomUserLabel(room)}
					isReadOnly
					onBack={back}
					onClosed={() => {
						markClosed();
						roomPage.refresh();
					}}
				/>
			</div>
		);
	}

	return (
		<div ref={rootRef} className="flex w-full min-w-0 flex-col pb-8">
			<AgentRoomList
				label="Agent runs"
				query={query}
				roomPage={roomPage}
				hasPageFilters={Boolean(filters.agentId || filters.userId)}
				onClearPageFilters={() => setFilters(NO_FILTERS)}
				filters={
					<>
						<AgentRunFilterSelect
							label="Agent"
							allLabel="All agents"
							selectedLabel={
								filters.agentId ? filters.agentLabel : null
							}
							selectedKey={filters.agentId || null}
							loadOptions={getAdminAgentRunAgents}
							getOptionKey={agentOptionKey}
							renderOption={(agent) => (
								<span className="flex min-w-0 flex-col">
									<span className="truncate text-sm">
										{agentOptionLabel(agent)}
									</span>
									<AgentRoomDetailLine>
										id: {agent.agentId}
									</AgentRoomDetailLine>
								</span>
							)}
							onSelect={(agent) =>
								filterBy({
									agentId: agent?.agentId ?? "",
									agentLabel: agent
										? agentOptionLabel(agent)
										: "",
								})
							}
							searchPlaceholder="Search agents"
						/>
						<AgentRunFilterSelect
							label="User"
							allLabel="All users"
							selectedLabel={
								filters.userId ? filters.userLabel : null
							}
							selectedKey={
								filters.userId
									? `${filters.userType}:${filters.userId}`
									: null
							}
							loadOptions={getAdminAgentRunUsers}
							getOptionKey={userOptionKey}
							renderOption={(user) => (
								<PersonIdentity
									name={userOptionLabel(user)}
									type={user.userType ?? ""}
									id={user.userId}
									email={user.userEmail}
									isCompact
								/>
							)}
							onSelect={(user) =>
								filterBy({
									userId: user?.userId ?? "",
									userType: user?.userType ?? "",
									userLabel: user
										? userOptionLabel(user)
										: "",
								})
							}
							searchPlaceholder="Search users"
						/>
					</>
				}
				columns={AGENT_RUN_ROOM_COLUMNS}
				emptyTitle="No agent runs yet"
				emptyDescription="Each conversation a user has with an agent will appear here."
				onOpen={(room) => open(room)}
			/>
		</div>
	);
};
