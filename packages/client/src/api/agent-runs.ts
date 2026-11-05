import {
	getAgentRun as getSdkAgentRun,
	getSubagentRuns as getSdkSubagentRuns,
} from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import type {
	AgentActivityRun,
	AgentRunDetail,
	EngineInfo,
	SubagentRun,
} from "@/features/agent-activity/agent-activity-types";
import type { ClaudeCodeTranscriptEvent } from "@/features/agent-activity/claude-code-transcript";
import { auditPixelLiteral } from "./audit-pixel";

/** Rooms a room list shows per page */
export const AGENT_RUN_ROOMS_PAGE_SIZE = 25;

/** Which runs a listed room must hold */
export type AgentRunRoomStatusFilter = "all" | "active" | "failed";

/** The statuses each status filter matches */
const STATUS_FILTER_STATUSES: Record<AgentRunRoomStatusFilter, string[]> = {
	all: [],
	active: ["SUBMITTED", "RUNNING", "INPUT_REQUIRED"],
	failed: ["FAILED"],
};

/** Which rooms the admin Agent Runs page lists */
export interface AgentRunRoomFilters {
	/** Rooms holding a run of this agent, or empty for every agent */
	agentId: string;
	/** This user's rooms, or empty for every user */
	userId: string;
	/** The login type of `userId`, or empty to match the id under any type */
	userType: string;
	/** Rooms whose name or id contains this text, or empty for every room */
	search: string;
	/** Which runs a room must hold */
	status: AgentRunRoomStatusFilter;
}

export const EMPTY_AGENT_RUN_ROOM_FILTERS: AgentRunRoomFilters = {
	agentId: "",
	userId: "",
	userType: "",
	search: "",
	status: "all",
};

/** How many choices the agent and user filters list for a search */
export const AGENT_RUN_FILTER_OPTION_LIMIT = 25;

/** An agent the agent filter offers */
export interface AgentRunAgentOption {
	agentId: string;
	/** Its name as the catalog has it, or null when it has none */
	agentName: string | null;
}

/** A user the user filter offers: an id and the login type their runs store */
export interface AgentRunUserOption {
	userId: string;
	/** Their login type, such as NATIVE */
	userType: string | null;
	userName: string | null;
	userEmail: string | null;
}

/** One user's conversation with an agent, as a room list shows it */
export interface AgentRunRoom {
	roomId: string;
	roomName: string | null;
	userId: string;
	/** The user's name, from the admin read; null in the user's own list */
	userName: string | null;
	userEmail: string | null;
	/**
	 * The user's login type, such as NATIVE: the one the room's runs store, else
	 * the first login with the id
	 */
	userType: string | null;
	agentId: string | null;
	/** The agent's name, from the admin read; null in the user's own list */
	agentName: string | null;
	runCount: number;
	/** Runs not yet finished: submitted, running or waiting for input */
	activeRunCount: number;
	failedRunCount: number;
	/** Whether the room is closed, so no agent runs in it again */
	isClosed: boolean;
	firstRunAt: string | null;
	lastActivityAt: string | null;
}

/** What closing a room did */
export interface AgentRunRoomClosure {
	/** The rooms closed: the room and its subagents' rooms */
	closedRoomIds: string[];
	/** The runs stopped; runs that had finished are left as they were */
	cancelledRunIds: string[];
}

/** One page of rooms and how many match in all */
export interface AgentRunRoomsPage {
	rooms: AgentRunRoom[];
	total: number;
}

/**
 * Builds the read of one page of rooms: the page, then the reactor's own
 * filters, then the room search and status every room list has.
 *
 * @param reactor - The reactor that lists the rooms.
 * @param filterArgs - The reactor's own filters, as pixel arguments.
 * @param search - Text a room's name or id contains, or empty.
 * @param status - Which runs a room must hold.
 * @param page - The page, from 0.
 * @returns The pixel.
 */
const roomPagePixel = (
	reactor: string,
	filterArgs: string[],
	search: string,
	status: AgentRunRoomStatusFilter,
	page: number,
): string => {
	if (!Number.isSafeInteger(page) || page < 0) {
		throw new Error("Invalid agent runs page.");
	}
	const args = [
		`limit=[${AGENT_RUN_ROOMS_PAGE_SIZE}]`,
		`offset=[${page * AGENT_RUN_ROOMS_PAGE_SIZE}]`,
		...filterArgs,
	];
	const trimmed = search.trim();
	if (trimmed) {
		args.push(`search=[${auditPixelLiteral(trimmed)}]`);
	}
	const statuses = STATUS_FILTER_STATUSES[status];
	if (statuses.length > 0) {
		args.push(
			`status=[${statuses.map((value) => auditPixelLiteral(value)).join(", ")}]`,
		);
	}
	return `${reactor}(${args.join(", ")});`;
};

/**
 * Builds the admin read of one page of every user's rooms.
 *
 * @param filters - Which rooms to list.
 * @param page - The page, from 0.
 * @returns The pixel.
 */
export const buildAdminAgentRunRoomsPixel = (
	filters: AgentRunRoomFilters,
	page: number,
): string => {
	const args: string[] = [];
	const agentId = filters.agentId.trim();
	if (agentId) {
		args.push(`agentId=[${auditPixelLiteral(agentId)}]`);
	}
	const userId = filters.userId.trim();
	if (userId) {
		args.push(`userId=[${auditPixelLiteral(userId)}]`);
		const userType = filters.userType.trim();
		if (userType) {
			args.push(`userType=[${auditPixelLiteral(userType)}]`);
		}
	}
	return roomPagePixel(
		"AdminGetAgentRunRooms",
		args,
		filters.search,
		filters.status,
		page,
	);
};

/**
 * Builds the read of one page of the signed in user's own rooms with an agent,
 * rooms it ran in as another agent's subagent included.
 *
 * @param agentId - The agent.
 * @param search - Text a room's name or id contains, or empty.
 * @param status - Which runs a room must hold.
 * @param page - The page, from 0.
 * @returns The pixel.
 */
export const buildAgentRunRoomsPixel = (
	agentId: string,
	search: string,
	status: AgentRunRoomStatusFilter,
	page: number,
): string =>
	roomPagePixel(
		"GetAgentRunRooms",
		[`agentId=[${auditPixelLiteral(agentId.trim())}]`],
		search,
		status,
		page,
	);

const text = (value: unknown): string | null =>
	typeof value === "string" && value !== "" ? value : null;

const count = (value: unknown): number =>
	typeof value === "number" && Number.isFinite(value) ? value : 0;

/**
 * Reads a page of rooms from the backend's reply, keeping only rooms with a
 * room and a user.
 *
 * @param output - The reply.
 * @returns The rooms and how many match.
 */
export const parseAgentRunRooms = (output: unknown): AgentRunRoomsPage => {
	if (!isRecord(output) || !Array.isArray(output.rooms)) {
		throw new Error("The agent runs response is missing its rooms.");
	}
	const rooms: AgentRunRoom[] = [];
	for (const room of output.rooms) {
		if (!isRecord(room)) {
			continue;
		}
		const roomId = text(room.roomId);
		const userId = text(room.userId);
		if (!roomId || !userId) {
			continue;
		}
		rooms.push({
			roomId,
			roomName: text(room.roomName),
			userId,
			userName: text(room.userName),
			userEmail: text(room.userEmail),
			userType: text(room.userType),
			agentId: text(room.agentId),
			agentName: text(room.agentName),
			runCount: count(room.runCount),
			activeRunCount: count(room.activeRunCount),
			failedRunCount: count(room.failedRunCount),
			isClosed: room.isClosed === true,
			firstRunAt: text(room.firstRunAt),
			lastActivityAt: text(room.lastActivityAt),
		});
	}
	return { rooms, total: count(output.total) };
};

/**
 * Runs an agent runs reactor and returns its output.
 *
 * @param pixel - The reactor's call.
 * @param failure - The error when the backend gives no reason.
 * @returns The output.
 */
const runAgentRunsPixel = async <T>(
	pixel: string,
	failure: string,
): Promise<T> => {
	const response = await runPixel(pixel);
	const result = response?.pixelReturn?.[0];
	if (!result || result.operationType?.includes("ERROR")) {
		throw new Error(
			typeof result?.output === "string" ? result.output : failure,
		);
	}
	return result.output as T;
};

/**
 * Runs a read and returns its output.
 *
 * @param pixel - The read.
 * @param what - What it reads, for the error.
 * @returns The output.
 */
const readOutput = <T>(pixel: string, what: string): Promise<T> =>
	runAgentRunsPixel<T>(pixel, `The ${what} could not be read.`);

/**
 * Runs a read whose reply is a list, refusing a reply that is not one.
 *
 * @param pixel - The read.
 * @param what - What it reads, for the error.
 * @returns The list's objects, or none for an empty reply.
 */
const readList = async <T>(pixel: string, what: string): Promise<T[]> => {
	const output = await readOutput<unknown>(pixel, what);
	if (output === null || output === undefined) {
		return [];
	}
	if (!Array.isArray(output)) {
		throw new Error(`The ${what} response is not a list.`);
	}
	return output.filter(isRecord) as unknown as T[];
};

/**
 * Runs a read whose reply is one object, refusing a reply that is not.
 *
 * @param pixel - The read.
 * @param what - What it reads, for the error.
 * @returns The object.
 */
const readRecord = async <T>(pixel: string, what: string): Promise<T> => {
	const output = await readOutput<unknown>(pixel, what);
	if (!isRecord(output)) {
		throw new Error(`The ${what} response is missing.`);
	}
	return output as unknown as T;
};

/**
 * The arguments that name one user's room: rooms are kept per user, by id and
 * login type.
 *
 * @param roomId - The room.
 * @param userId - The user the room belongs to.
 * @param userType - The login type of `userId`, or null to match the id under
 * any type.
 * @returns The pixel arguments.
 */
const roomUserArgs = (
	roomId: string,
	userId: string,
	userType: string | null,
): string[] => {
	const args = [
		`roomId=[${auditPixelLiteral(roomId)}]`,
		`userId=[${auditPixelLiteral(userId)}]`,
	];
	if (userType) {
		args.push(`userType=[${auditPixelLiteral(userType)}]`);
	}
	return args;
};

/**
 * Every run a user has in a room, newest first.
 *
 * @param roomId - The room.
 * @param userId - The user the room belongs to.
 * @param userType - The login type of `userId`, or null to match the id under
 * any type.
 * @returns The runs.
 */
export const getAdminAllAgentRunsForRoom = async (
	roomId: string,
	userId: string,
	userType: string | null,
): Promise<AgentActivityRun[]> =>
	readList<AgentActivityRun>(
		`AdminGetAllAgentRunsForRoom(${roomUserArgs(roomId, userId, userType).join(", ")});`,
		"room's runs",
	);

/**
 * Any user's run with its room messages.
 *
 * @param runId - The run.
 * @returns The run.
 */
export const getAdminAgentRun = (runId: string): Promise<AgentRunDetail> =>
	readRecord<AgentRunDetail>(
		`AdminGetAgentRun(runId=[${auditPixelLiteral(runId)}], includeMessages=[true]);`,
		"agent run",
	);

/**
 * The direct subagent runs of any user's run.
 *
 * @param runId - The parent run.
 * @returns The subagent runs.
 */
export const getAdminSubagentRuns = (runId: string): Promise<SubagentRun[]> =>
	readList<SubagentRun>(
		`AdminGetSubagentRuns(runId=[${auditPixelLiteral(runId)}]);`,
		"subagent runs",
	);

/**
 * Builds the read of a filter's choices.
 *
 * @param reactor - The reactor that lists them.
 * @param search - The text they must contain, or empty for the most recent.
 * @returns The pixel.
 */
const filterOptionsPixel = (reactor: string, search: string): string => {
	const args = [`limit=[${AGENT_RUN_FILTER_OPTION_LIMIT}]`];
	const trimmed = search.trim();
	if (trimmed) {
		args.push(`search=[${auditPixelLiteral(trimmed)}]`);
	}
	return `${reactor}(${args.join(", ")});`;
};

/** The records of a list, or none when it is not one */
const recordList = (value: unknown): Record<string, unknown>[] =>
	Array.isArray(value) ? value.filter(isRecord) : [];

/**
 * The agents of the rooms listed, most recently active first, for the agent
 * filter.
 *
 * @param search - Text an agent's name or id contains, or empty.
 * @returns The agents.
 */
export const getAdminAgentRunAgents = async (
	search: string,
): Promise<AgentRunAgentOption[]> =>
	recordList(
		await readOutput<unknown>(
			filterOptionsPixel("AdminGetAgentRunAgents", search),
			"agents",
		),
	).flatMap((agent) => {
		const agentId = text(agent.agentId);
		return agentId ? [{ agentId, agentName: text(agent.agentName) }] : [];
	});

/**
 * The users of the rooms listed, most recently active first, for the user
 * filter.
 *
 * @param search - Text a user's name, username, email or id contains, or empty.
 * @returns The users.
 */
export const getAdminAgentRunUsers = async (
	search: string,
): Promise<AgentRunUserOption[]> =>
	recordList(
		await readOutput<unknown>(
			filterOptionsPixel("AdminGetAgentRunUsers", search),
			"users",
		),
	).flatMap((user) => {
		const userId = text(user.userId);
		return userId
			? [
					{
						userId,
						userType: text(user.userType),
						userName: text(user.userName),
						userEmail: text(user.userEmail),
					},
				]
			: [];
	});

/** The strings of a list, or none when it is not one */
const textList = (value: unknown): string[] =>
	Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];

/**
 * Closes any user's room, so no agent runs in it again: the room and its
 * subagents' rooms are closed, and every run in them that has not finished is
 * stopped, even mid-step. The user no longer sees the rooms.
 *
 * @param roomId - The room.
 * @param userId - The user the room belongs to.
 * @param userType - The login type of `userId`, or null to match the id under
 * any type.
 * @returns The rooms closed and the runs stopped.
 */
export const closeAdminAgentRunRoom = async (
	roomId: string,
	userId: string,
	userType: string | null,
): Promise<AgentRunRoomClosure> =>
	parseRoomClosure(
		await runAgentRunsPixel<unknown>(
			`AdminCloseRoom(${roomUserArgs(roomId, userId, userType).join(", ")});`,
			"The room could not be closed.",
		),
	);

/**
 * Closes one of the signed in user's own rooms, so no agent runs in it again:
 * the room and its subagents' rooms are closed, and every run in them that has
 * not finished is stopped, even mid-step. The user no longer sees the rooms.
 *
 * @param roomId - The user's room.
 * @returns The rooms closed and the runs stopped.
 */
export const closeAgentRoom = async (
	roomId: string,
): Promise<AgentRunRoomClosure> =>
	parseRoomClosure(
		await runAgentRunsPixel<unknown>(
			`CloseRoom(roomId=[${auditPixelLiteral(roomId)}]);`,
			"The room could not be closed.",
		),
	);

/**
 * Reads what closing a room did from the backend's reply.
 *
 * @param output - The reply.
 * @returns The rooms closed and the runs stopped.
 */
const parseRoomClosure = (output: unknown): AgentRunRoomClosure => {
	if (!isRecord(output)) {
		throw new Error("The room close response is missing its result.");
	}
	return {
		closedRoomIds: textList(output.closedRoomIds),
		cancelledRunIds: textList(output.cancelledRunIds),
	};
};

/**
 * Any user's room's Claude Code transcript.
 *
 * @param roomId - The room.
 * @returns The transcript's events.
 */
export const getAdminClaudeCodeTranscript = (
	roomId: string,
): Promise<ClaudeCodeTranscriptEvent[]> =>
	readList<ClaudeCodeTranscriptEvent>(
		`AdminGetClaudeCodeTranscriptHistory(roomId=[${auditPixelLiteral(roomId)}]);`,
		"transcript",
	);

/**
 * Every run the signed in user has in one of their rooms, newest first,
 * subagent runs included.
 *
 * @param roomId - The user's room.
 * @returns The runs.
 */
export const getAllAgentRunsForRoom = (
	roomId: string,
): Promise<AgentActivityRun[]> =>
	readList<AgentActivityRun>(
		`GetAllAgentRunsForRoom(roomId=[${auditPixelLiteral(roomId)}]);`,
		"room's runs",
	);

/**
 * One of the signed in user's runs with its room messages, read with the SDK's
 * `getAgentRun`. The backend returns every field the run graph reads, more than
 * the SDK's snapshot type names.
 *
 * @param runId - The run.
 * @returns The run.
 */
export const getAgentRun = async (runId: string): Promise<AgentRunDetail> => {
	const run: unknown = await getSdkAgentRun(runId, { includeMessages: true });
	if (!isRecord(run)) {
		throw new Error("The agent run response is missing.");
	}
	return run as unknown as AgentRunDetail;
};

/**
 * The direct subagent runs of one of the signed in user's runs, read with the
 * SDK's `getSubagentRuns`.
 *
 * @param runId - The parent run.
 * @returns The subagent runs.
 */
export const getSubagentRuns = async (
	runId: string,
): Promise<SubagentRun[]> => {
	const runs: unknown = await getSdkSubagentRuns(runId);
	if (runs === null || runs === undefined) {
		return [];
	}
	if (!Array.isArray(runs)) {
		throw new Error("The subagent runs response is not a list.");
	}
	return runs.filter(isRecord) as unknown as SubagentRun[];
};

/**
 * One of the signed in user's rooms' Claude Code transcript.
 *
 * @param roomId - The room.
 * @returns The transcript's events.
 */
export const getClaudeCodeTranscript = (
	roomId: string,
): Promise<ClaudeCodeTranscriptEvent[]> =>
	readList<ClaudeCodeTranscriptEvent>(
		`GetClaudeCodeTranscriptHistory(roomId=[${auditPixelLiteral(roomId)}]);`,
		"transcript",
	);

/**
 * A model's display name, for a run whose read did not include it.
 *
 * @param engineId - The model.
 * @returns Its name, or null when it has none the user can read.
 */
export const getAgentRunModelInfo = async (
	engineId: string,
): Promise<EngineInfo | null> => {
	const output = await readOutput<unknown>(
		`GetEngineMetadata(engine=[${auditPixelLiteral(engineId)}], metaKeys=[["engine_display_name", "engine_name"]]);`,
		"model",
	);
	if (!isRecord(output)) {
		return null;
	}
	const name = text(output.engine_display_name) ?? text(output.engine_name);
	return name ? { name } : null;
};
