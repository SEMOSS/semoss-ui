import { useCallback, useRef, useState } from "react";
import type {
	AgentActivityRun,
	AgentRunDetail,
	EngineInfo,
	RoomRunDetail,
	SubagentRun,
	SubagentRunNode,
} from "./agent-activity-types";
import type { ClaudeCodeTranscriptEvent } from "./claude-code-transcript";
import { mergeClaudeCodeTranscript } from "./claude-code-transcript";

/** How deep a subagent tree is loaded, a safety net against runaway nesting */
const MAX_SUBAGENT_DEPTH = 5;

/**
 * The reads that load a room's runs: the owner's own, from an agent's Activity
 * tab, or an admin's of any user's, from the admin Agent Runs page. Pass the
 * same object each render, such as a module constant or a memoized one.
 */
export interface AgentRoomRunsSource {
	/** A run with its room messages */
	fetchRunDetail: (runId: string) => Promise<AgentRunDetail>;
	/** A run's direct subagent runs */
	fetchSubagentRuns: (runId: string) => Promise<SubagentRun[]>;
	/** A room's Claude Code transcript */
	fetchClaudeCodeTranscript: (
		roomId: string,
	) => Promise<ClaudeCodeTranscriptEvent[]>;
	/** A model's display name, for a run whose read did not include it */
	fetchEngineInfo?: (engineId: string) => Promise<EngineInfo | null>;
}

/** How {@link UseAgentRoomRunsResult.loadRoom} narrows what it loads */
export interface LoadAgentRoomOptions {
	/** Loads only this run, rather than the room's root runs */
	requestedRunId?: string;
	/** The agent a requested run must belong to */
	workspaceId?: string;
}

export interface UseAgentRoomRunsResult {
	/** The open room's runs, each with its transcript and subagent tree */
	runs: RoomRunDetail[];
	/** Model display names, keyed by engine id */
	engineInfo: Record<string, EngineInfo>;
	/**
	 * Loads a room's runs from its run list and shows them, returning what it
	 * loaded. A load that a newer one or `clear` overtook returns its runs but
	 * does not show them.
	 */
	loadRoom: (
		roomId: string,
		roomRuns: AgentActivityRun[],
		options?: LoadAgentRoomOptions,
	) => Promise<RoomRunDetail[]>;
	/** Clears the open room's runs */
	clear: () => void;
}

type TranscriptCache = Map<string, Promise<ClaudeCodeTranscriptEvent[]>>;

/** Every model a room's runs use, with the name its read gave, if any */
const collectModels = (runs: RoomRunDetail[]): Map<string, string | null> => {
	const models = new Map<string, string | null>();
	const visit = (run: AgentRunDetail) => {
		if (run.modelId && !models.get(run.modelId)) {
			models.set(run.modelId, run.modelName ?? null);
		}
	};
	const visitSubagent = (node: SubagentRunNode) => {
		visit(node);
		node.children.forEach(visitSubagent);
	};
	for (const run of runs) {
		visit(run);
		run.subagents.forEach(visitSubagent);
	}
	return models;
};

/**
 * claude_code-harness runs don't persist tool activity as room messages - it
 * lives in the room's Claude Code JSONL transcript. Fetch it once per room (the
 * cache holds the in-flight promise) and splice the parsed tool calls/results
 * into the run so the graph treats both harnesses the same.
 *
 * @param source - The reads to load with.
 * @param run - The run to add the transcript to.
 * @param transcriptCache - Transcripts already asked for, by room.
 * @param multiRunRoomId - The room whose transcript spans several runs, if any.
 * @returns The run, with its transcript's tool activity when it has one.
 */
const enrichWithClaudeCodeTranscript = async (
	source: AgentRoomRunsSource,
	run: AgentRunDetail,
	transcriptCache: TranscriptCache,
	multiRunRoomId: string | null,
): Promise<AgentRunDetail> => {
	if (run.harnessType !== "claude_code" || !run.roomId) {
		return run;
	}
	try {
		let pending = transcriptCache.get(run.roomId);
		if (!pending) {
			pending = source.fetchClaudeCodeTranscript(run.roomId);
			transcriptCache.set(run.roomId, pending);
		}
		const events = await pending;
		if (events.length === 0) {
			return run;
		}
		// The JSONL covers the whole room; narrow to this run's time window only
		// when other runs share the room.
		return mergeClaudeCodeTranscript(
			run,
			events,
			run.roomId === multiRunRoomId,
		);
	} catch (error) {
		// Transcript may be missing on disk - the run still renders from its
		// room messages.
		console.error("Error fetching Claude Code transcript:", error);
		return run;
	}
};

/**
 * Recursively load the subagent run tree under a run, pulling each subagent's
 * full transcript so the graph can show its room, tool calls, and nested
 * subagents just like the parent. `visited` guards against cycles/duplicates
 * across the whole room fetch; depth is capped as a safety net.
 *
 * @param source - The reads to load with.
 * @param runId - The run whose subagents are loaded.
 * @param visited - Runs already loaded for this room.
 * @param transcriptCache - Transcripts already asked for, by room.
 * @param multiRunRoomId - The room whose transcript spans several runs, if any.
 * @param depth - How deep this run is.
 * @returns The run's subagents, each with its own subagents.
 */
const fetchSubagentRunTree = async (
	source: AgentRoomRunsSource,
	runId: string,
	visited: Set<string>,
	transcriptCache: TranscriptCache,
	multiRunRoomId: string | null,
	depth = 0,
): Promise<SubagentRunNode[]> => {
	if (depth >= MAX_SUBAGENT_DEPTH) {
		return [];
	}
	const subagentRuns = (await source.fetchSubagentRuns(runId)).filter(
		(run) => !visited.has(run.runId),
	);
	for (const run of subagentRuns) {
		visited.add(run.runId);
	}
	return Promise.all(
		subagentRuns.map(async (run) => {
			const [detail, children] = await Promise.all([
				// A dead transcript shouldn't sink the whole room view - fall
				// back to the summary row with no messages.
				source
					.fetchRunDetail(run.runId)
					.catch(() => null),
				fetchSubagentRunTree(
					source,
					run.runId,
					visited,
					transcriptCache,
					multiRunRoomId,
					depth + 1,
				),
			]);
			const base = await enrichWithClaudeCodeTranscript(
				source,
				detail ?? { ...run, messages: [] },
				transcriptCache,
				multiRunRoomId,
			);
			return { ...base, children };
		}),
	);
};

/**
 * Loads a room's agent runs for the run graph: each root run's transcript and
 * its subagent tree, with Claude Code tool activity spliced in from the room's
 * transcript, and the models' display names.
 *
 * @param source - The reads to load them with, the same object each render.
 * @returns The open room's runs and model names, and the actions that load or
 * clear them.
 */
export const useAgentRoomRuns = (
	source: AgentRoomRunsSource,
): UseAgentRoomRunsResult => {
	const [runs, setRuns] = useState<RoomRunDetail[]>([]);
	const [engineInfo, setEngineInfo] = useState<Record<string, EngineInfo>>(
		{},
	);
	// Engine metadata is stable - cache lookups across rooms.
	const engineInfoCache = useRef(
		new Map<string, Promise<EngineInfo | null>>(),
	);
	// only the latest load shows its runs, so a slow earlier one cannot replace them
	const latestLoad = useRef(0);

	/**
	 * Resolve the models' display names in the background - the graph falls
	 * back to raw engine ids until these land. A name the run's read gave is
	 * used as is.
	 */
	const resolveEngineInfo = useCallback(
		async (models: Map<string, string | null>) => {
			const resolved: Record<string, EngineInfo> = {};
			const missing: string[] = [];
			for (const [id, name] of models) {
				if (name) {
					resolved[id] = { name };
				} else {
					missing.push(id);
				}
			}
			const { fetchEngineInfo } = source;
			if (fetchEngineInfo) {
				const entries = await Promise.all(
					missing.map(async (id) => {
						let pending = engineInfoCache.current.get(id);
						if (!pending) {
							pending = fetchEngineInfo(id).catch((error) => {
								console.error(
									"Error fetching engine metadata:",
									error,
								);
								return null;
							});
							engineInfoCache.current.set(id, pending);
						}
						return [id, await pending] as const;
					}),
				);
				for (const [id, info] of entries) {
					if (info) {
						resolved[id] = info;
					}
				}
			}
			if (Object.keys(resolved).length > 0) {
				setEngineInfo((prev) => ({ ...prev, ...resolved }));
			}
		},
		[source],
	);

	const loadRoom = useCallback(
		async (
			roomId: string,
			roomRuns: AgentActivityRun[],
			options: LoadAgentRoomOptions = {},
		): Promise<RoomRunDetail[]> => {
			const load = ++latestLoad.current;
			const { requestedRunId, workspaceId } = options;
			// Runs with a parent in this room render nested under it, so only
			// root the ones whose parent is elsewhere.
			const roomRunIds = new Set(roomRuns.map((run) => run.runId));
			const runIds = requestedRunId
				? [requestedRunId]
				: roomRuns
						.filter(
							(run) =>
								!run.parentRunId ||
								!roomRunIds.has(run.parentRunId),
						)
						.map((run) => run.runId);

			const visited = new Set(runIds);
			const transcriptCache: TranscriptCache = new Map();
			// Sub-agent rooms host a single run, but this room's JSONL spans
			// every run listed here - those need time-window filtering.
			const multiRunRoomId = roomRuns.length > 1 ? roomId : null;
			const runDetails = await Promise.all(
				runIds.map(async (runId) => {
					const [detail, subagents] = await Promise.all([
						source
							.fetchRunDetail(runId)
							.then((fetched) =>
								enrichWithClaudeCodeTranscript(
									source,
									fetched,
									transcriptCache,
									multiRunRoomId,
								),
							),
						fetchSubagentRunTree(
							source,
							runId,
							visited,
							transcriptCache,
							multiRunRoomId,
						),
					]);
					if (
						requestedRunId &&
						(detail.roomId !== roomId ||
							(workspaceId !== undefined &&
								detail.workspaceId !== workspaceId))
					) {
						throw new Error(
							"The requested run does not belong to this agent activity room.",
						);
					}
					return { ...detail, subagents };
				}),
			);
			if (load === latestLoad.current) {
				setRuns(runDetails);
				void resolveEngineInfo(collectModels(runDetails));
			}
			return runDetails;
		},
		[source, resolveEngineInfo],
	);

	const clear = useCallback(() => {
		latestLoad.current++;
		setRuns([]);
	}, []);

	return { runs, engineInfo, loadRoom, clear };
};
