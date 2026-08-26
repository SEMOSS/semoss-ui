import {
	ArrowLeft,
	ChevronRight,
	Clock,
	MessageSquare,
	RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Button, Skeleton, toast } from "@semoss/ui/next";
import { useProject, useRootStore } from "@/hooks";
import { formatDateToRelative } from "@/utility/date";
import type {
	AgentActivityLogResponse,
	AgentActivityRun,
	AgentRunDetail,
	EngineInfo,
	RoomRunDetail,
	RoomSummary,
	SubagentRun,
	SubagentRunNode,
} from "./agent-activity-types";
import { isActiveStatus, toMs } from "./agent-activity-types";
import { AgentRunGraph } from "./agent-run-graph";
import type { ClaudeCodeTranscriptEvent } from "./claude-code-transcript";
import { mergeClaudeCodeTranscript } from "./claude-code-transcript";

const MAX_SUBAGENT_DEPTH = 5;

/** Subset of the GetEngineMetadata output this page reads. */
interface EngineMetadataOutput {
	engine_display_name?: string;
	engine_name?: string;
}

/** Every distinct model engine id used by the runs, incl. nested subagents. */
const collectModelIds = (runs: RoomRunDetail[]): Set<string> => {
	const ids = new Set<string>();
	const visitSubagent = (node: SubagentRunNode) => {
		if (node.modelId) {
			ids.add(node.modelId);
		}
		node.children.forEach(visitSubagent);
	};
	for (const run of runs) {
		if (run.modelId) {
			ids.add(run.modelId);
		}
		run.subagents.forEach(visitSubagent);
	}
	return ids;
};

const summarizeRoom = (
	roomId: string,
	runs: AgentActivityRun[],
): RoomSummary => {
	let roomName: string | null = null;
	let mostRecentCompletedAt: string | null = null;
	let mostRecentCompletedMs = -Infinity;
	let sortMs = -Infinity;

	for (const run of runs) {
		if (!roomName && run.roomName) {
			roomName = run.roomName;
		}

		const completedMs = toMs(run.completedAt);
		if (completedMs > mostRecentCompletedMs) {
			mostRecentCompletedMs = completedMs;
			mostRecentCompletedAt = run.completedAt ?? null;
		}

		sortMs = Math.max(
			sortMs,
			completedMs,
			toMs(run.startedAt),
			toMs(run.dateCreated),
		);
	}

	return {
		roomId,
		roomName,
		runCount: runs.length,
		mostRecentCompletedAt,
		sortMs,
	};
};

/**
 * The "Agent Activity" tab of the agent workspace settings panel - lists the
 * rooms (conversations) this agent has run in, most recently active first.
 * Clicking a room loads its runs (transcripts via GetAgentRun, sub-agent
 * hierarchy via GetSubagentRuns) and renders them as a node graph.
 */
export const AgentActivityPage = () => {
	const { project } = useProject();
	const { monolithStore } = useRootStore();
	const [searchParams] = useSearchParams();
	const targetRoomId = searchParams.get("roomId")?.trim() || null;
	const targetRunId = searchParams.get("runId")?.trim() || null;
	const handledDeepLink = useRef<string | null>(null);
	const openRoom = useRef<
		((room: RoomSummary, requestedRunId?: string) => Promise<void>) | null
	>(null);

	const [activity, setActivity] = useState<AgentActivityLogResponse>({});
	const [loading, setLoading] = useState(true);

	const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null);
	const [selectedRoomRuns, setSelectedRoomRuns] = useState<RoomRunDetail[]>(
		[],
	);
	const [loadingRunDetails, setLoadingRunDetails] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const [engineInfo, setEngineInfo] = useState<Record<string, EngineInfo>>(
		{},
	);
	// Engine metadata is stable - cache lookups across room clicks.
	const engineInfoCache = useRef(
		new Map<string, Promise<EngineInfo | null>>(),
	);

	/**
	 * Pull the activity log. Returns the fresh map rather than only writing it
	 * to state so a refresh can reload the open room from what it just fetched
	 * - a run that started after the page loaded isn't in the copy in state.
	 */
	const fetchActivity = useCallback(async () => {
		const agentId = project.project_id;
		if (!agentId) {
			return {} as AgentActivityLogResponse;
		}
		const response = await monolithStore.runQuery<
			[AgentActivityLogResponse]
		>(
			`GetAgentActivityLog(agentId=${JSON.stringify([agentId])}, limit=[20], sortByRoom=[true]);`,
		);
		const { operationType, output } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			throw new Error(String(output));
		}
		return output ?? {};
	}, [project.project_id, monolithStore]);

	useEffect(() => {
		if (!project.project_id) {
			return;
		}

		let cancelled = false;

		const loadActivity = async () => {
			setLoading(true);
			try {
				const output = await fetchActivity();
				if (!cancelled) {
					setActivity(output);
				}
			} catch (error) {
				if (!cancelled) {
					setActivity({});
					toast.error(`Error fetching agent activity: ${error}`);
				}
				console.error("Error fetching agent activity:", error);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		loadActivity();

		return () => {
			cancelled = true;
		};
	}, [project.project_id, fetchActivity]);

	const rooms = useMemo(() => {
		return Object.entries(activity)
			.map(([roomId, runs]) => summarizeRoom(roomId, runs))
			.sort((a, b) => b.sortMs - a.sortMs);
	}, [activity]);
	const deepLinkedRoom = useMemo(() => {
		if (!targetRoomId) return null;
		return (
			rooms.find((room) => room.roomId === targetRoomId) ?? {
				roomId: targetRoomId,
				roomName: null,
				runCount: targetRunId ? 1 : 0,
				mostRecentCompletedAt: null,
				sortMs: -Infinity,
			}
		);
	}, [rooms, targetRoomId, targetRunId]);

	const fetchRunDetail = async (runId: string): Promise<AgentRunDetail> => {
		const response = await monolithStore.runQuery<[AgentRunDetail]>(
			`GetAgentRun(runId=${JSON.stringify(runId)}, includeMessages=["true"]);`,
		);
		const { operationType, output } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			throw new Error(String(output));
		}
		return output;
	};

	/**
	 * Resolve a model engine id to its display name via GetEngineMetadata so
	 * the graph can show "CallCenterModel" instead of the engine UUID stored
	 * on AGENT_RUN.
	 */
	const fetchEngineInfo = (engineId: string): Promise<EngineInfo | null> => {
		let pending = engineInfoCache.current.get(engineId);
		if (!pending) {
			pending = monolithStore
				.runQuery<[EngineMetadataOutput]>(
					`GetEngineMetadata(engine=${JSON.stringify([engineId])}, metaKeys=${JSON.stringify(
						[["engine_display_name", "engine_name"]],
					)});`,
				)
				.then((response) => {
					const { operationType, output } = response.pixelReturn[0];
					if (operationType.indexOf("ERROR") > -1) {
						throw new Error(String(output));
					}
					const name =
						output?.engine_display_name || output?.engine_name;
					return name ? { name } : null;
				})
				.catch((error) => {
					console.error("Error fetching engine metadata:", error);
					return null;
				});
			engineInfoCache.current.set(engineId, pending);
		}
		return pending;
	};

	const resolveEngineInfo = async (modelIds: Set<string>) => {
		const entries = await Promise.all(
			Array.from(modelIds).map(
				async (id) => [id, await fetchEngineInfo(id)] as const,
			),
		);
		const resolved: Record<string, EngineInfo> = {};
		for (const [id, info] of entries) {
			if (info) {
				resolved[id] = info;
			}
		}
		if (Object.keys(resolved).length > 0) {
			setEngineInfo((prev) => ({ ...prev, ...resolved }));
		}
	};

	/**
	 * claude_code-harness runs don't persist tool activity as room messages -
	 * it lives in the room's Claude Code JSONL transcript. Fetch it once per
	 * room (the cache holds the in-flight promise) and splice the parsed tool
	 * calls/results into the run so the graph treats both harnesses the same.
	 */
	const enrichWithClaudeCodeTranscript = async (
		run: AgentRunDetail,
		transcriptCache: Map<string, Promise<ClaudeCodeTranscriptEvent[]>>,
		multiRunRoomId: string | null,
	): Promise<AgentRunDetail> => {
		if (run.harnessType !== "claude_code" || !run.roomId) {
			return run;
		}
		try {
			let pending = transcriptCache.get(run.roomId);
			if (!pending) {
				pending = monolithStore
					.runQuery<[ClaudeCodeTranscriptEvent[]]>(
						`GetClaudeCodeTranscriptHistory(roomId=${JSON.stringify(run.roomId)});`,
					)
					.then((response) => {
						const { operationType, output } =
							response.pixelReturn[0];
						if (operationType.indexOf("ERROR") > -1) {
							throw new Error(String(output));
						}
						return output ?? [];
					});
				transcriptCache.set(run.roomId, pending);
			}
			const events = await pending;
			if (events.length === 0) {
				return run;
			}
			// The JSONL covers the whole room; narrow to this run's time
			// window only when other runs share the room.
			return mergeClaudeCodeTranscript(
				run,
				events,
				run.roomId === multiRunRoomId,
			);
		} catch (error) {
			// Transcript may be missing on disk - the run still renders from
			// its room messages.
			console.error("Error fetching Claude Code transcript:", error);
			return run;
		}
	};

	/**
	 * Recursively load the subagent run tree under a run via GetSubagentRuns,
	 * pulling each subagent's full transcript via GetAgentRun so the graph can
	 * show its room, tool calls, and nested subagents just like the parent.
	 * `visited` guards against cycles/duplicates across the whole room fetch;
	 * depth is capped as a safety net.
	 */
	const fetchSubagentRunTree = async (
		runId: string,
		visited: Set<string>,
		transcriptCache: Map<string, Promise<ClaudeCodeTranscriptEvent[]>>,
		multiRunRoomId: string | null,
		depth = 0,
	): Promise<SubagentRunNode[]> => {
		if (depth >= MAX_SUBAGENT_DEPTH) {
			return [];
		}
		const response = await monolithStore.runQuery<[SubagentRun[]]>(
			`GetSubagentRuns(runId=${JSON.stringify(runId)});`,
		);
		const { operationType, output } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			throw new Error(String(output));
		}
		const subagentRuns = (output ?? []).filter(
			(run) => !visited.has(run.runId),
		);
		for (const run of subagentRuns) {
			visited.add(run.runId);
		}
		return Promise.all(
			subagentRuns.map(async (run) => {
				const [detail, children] = await Promise.all([
					// A dead transcript shouldn't sink the whole room view -
					// fall back to the summary row with no messages.
					fetchRunDetail(run.runId).catch(() => null),
					fetchSubagentRunTree(
						run.runId,
						visited,
						transcriptCache,
						multiRunRoomId,
						depth + 1,
					),
				]);
				const base = await enrichWithClaudeCodeTranscript(
					detail ?? { ...run, messages: [] },
					transcriptCache,
					multiRunRoomId,
				);
				return { ...base, children };
			}),
		);
	};

	/**
	 * Load a room's graph data - each root run's transcript plus its sub-agent
	 * tree - and hand it to the graph. `activityLog` is a parameter rather than
	 * a read off state so a refresh works from the log it just fetched.
	 * `requestedRunId` narrows to a single deep-linked run instead of the
	 * room's root runs.
	 */
	const loadRoomRuns = async (
		room: RoomSummary,
		activityLog: AgentActivityLogResponse,
		requestedRunId?: string,
	) => {
		const allRuns = activityLog[room.roomId] ?? [];
		// Runs with a parent in this room render nested under it via
		// GetSubagentRuns, so only root the ones whose parent is elsewhere.
		const roomRunIds = new Set(allRuns.map((run) => run.runId));
		const runIds = requestedRunId
			? [requestedRunId]
			: allRuns
					.filter(
						(run) =>
							!run.parentRunId ||
							!roomRunIds.has(run.parentRunId),
					)
					.map((run) => run.runId);

		const visited = new Set(runIds);
		const transcriptCache = new Map<
			string,
			Promise<ClaudeCodeTranscriptEvent[]>
		>();
		// Sub-agent rooms host a single run, but this room's JSONL spans
		// every run listed here - those need time-window filtering.
		const multiRunRoomId = allRuns.length > 1 ? room.roomId : null;
		const runDetails = await Promise.all(
			runIds.map(async (runId) => {
				const [detail, subagents] = await Promise.all([
					fetchRunDetail(runId).then((fetched) =>
						enrichWithClaudeCodeTranscript(
							fetched,
							transcriptCache,
							multiRunRoomId,
						),
					),
					fetchSubagentRunTree(
						runId,
						visited,
						transcriptCache,
						multiRunRoomId,
					),
				]);
				if (
					requestedRunId &&
					(detail.roomId !== room.roomId ||
						detail.workspaceId !== project.project_id)
				) {
					throw new Error(
						"The requested run does not belong to this agent activity room.",
					);
				}
				return { ...detail, subagents };
			}),
		);
		setSelectedRoomRuns(runDetails);
		// Resolve model display names in the background - the graph
		// falls back to raw engine ids until these land.
		void resolveEngineInfo(collectModelIds(runDetails));
		return runDetails;
	};

	const handleRoomClick = async (
		room: RoomSummary,
		requestedRunId?: string,
	) => {
		setSelectedRoom(room);
		setSelectedRoomRuns([]);
		setLoadingRunDetails(true);

		try {
			await loadRoomRuns(room, activity, requestedRunId);
		} catch (error) {
			console.error("Error fetching agent run:", error);
			toast.error(`Error fetching agent run: ${error}`);
		} finally {
			setLoadingRunDetails(false);
		}
	};
	openRoom.current = handleRoomClick;

	useEffect(() => {
		if (!deepLinkedRoom) return;
		const key = `${deepLinkedRoom.roomId}:${targetRunId ?? ""}`;
		if (handledDeepLink.current === key) return;
		handledDeepLink.current = key;
		void openRoom.current?.(deepLinkedRoom, targetRunId ?? undefined);
	}, [deepLinkedRoom, targetRunId]);

	/**
	 * Re-pull the open room: the activity log first (so a run that started
	 * since the page loaded shows up), then every run in it. The graph stays
	 * mounted while this happens - only the button spins - so refreshing
	 * mid-inspection keeps the selected node and the current pan/zoom.
	 *
	 * Reports what came back rather than refreshing silently. A run still in
	 * progress has nothing new to show: the semoss harness only writes its room
	 * messages at a tool-approval pause or at the end of the run, so a mid-run
	 * refresh legitimately returns the same graph and would otherwise look like
	 * a button that does nothing.
	 */
	const handleRefresh = async () => {
		if (!selectedRoom || refreshing || loadingRunDetails) {
			return;
		}

		setRefreshing(true);
		try {
			const freshActivity = await fetchActivity();
			setActivity(freshActivity);
			// The log is capped, so a busy agent can push this room off it.
			// Fall back to the runs already held rather than blanking the graph.
			const activityLog = freshActivity[selectedRoom.roomId]
				? freshActivity
				: {
						...freshActivity,
						[selectedRoom.roomId]:
							activity[selectedRoom.roomId] ?? [],
					};
			const runDetails = await loadRoomRuns(selectedRoom, activityLog);
			const label = `${runDetails.length} ${runDetails.length === 1 ? "run" : "runs"}`;
			const inProgress = runDetails.filter((run) =>
				isActiveStatus(run.status),
			).length;
			toast.success(
				inProgress > 0
					? `Refreshed - ${label}, ${inProgress} still in progress`
					: `Refreshed - ${label}`,
			);
		} catch (error) {
			console.error("Error refreshing agent activity:", error);
			toast.error(`Error refreshing agent activity: ${error}`);
		} finally {
			setRefreshing(false);
		}
	};

	const handleBackToList = () => {
		setSelectedRoom(null);
		setSelectedRoomRuns([]);
	};

	if (loading) {
		return (
			<div className="flex flex-col gap-2">
				{["a", "b", "c", "d", "e", "f"].map((key) => (
					<Skeleton
						key={`activity-skeleton-${key}`}
						className="h-14 w-full rounded-xl"
					/>
				))}
			</div>
		);
	}

	// Checked before the empty state: a refresh that comes back with nothing
	// (or with this room aged off the capped log) must not eject you from the
	// room you are looking at.
	if (selectedRoom) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon-sm"
						title="Back to list"
						onClick={handleBackToList}
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div className="min-w-0 flex-1">
						<h6
							className={
								selectedRoom.roomName
									? "font-semibold text-sm"
									: "font-mono font-semibold text-sm"
							}
							title={selectedRoom.roomId}
						>
							{selectedRoom.roomName ?? selectedRoom.roomId}
						</h6>
						<p className="text-muted-foreground text-xs">
							Execution graph of agent runs, sub-agents, and tool
							calls in this room.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="shrink-0"
						title="Pull the latest runs for this room"
						disabled={refreshing || loadingRunDetails}
						onClick={handleRefresh}
					>
						<RefreshCw
							className={
								refreshing ? "size-4 animate-spin" : "size-4"
							}
						/>
						Refresh
					</Button>
				</div>

				{loadingRunDetails ? (
					<Skeleton className="h-[600px] w-full rounded-xl" />
				) : selectedRoomRuns.length > 0 ? (
					<AgentRunGraph
						key={selectedRoom.roomId}
						roomId={selectedRoom.roomId}
						roomName={selectedRoom.roomName ?? undefined}
						runs={selectedRoomRuns}
						engineInfo={engineInfo}
					/>
				) : (
					<p className="text-muted-foreground text-sm">
						No run data available.
					</p>
				)}
			</div>
		);
	}

	if (rooms.length === 0) {
		return (
			<div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
				<MessageSquare className="size-8 opacity-50" />
				<p className="text-sm">No activity yet for this agent.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h6 className="font-semibold text-xl">Agent Activity</h6>
				<p className="text-muted-foreground text-sm">
					Rooms this agent has run in, most recently active first.
				</p>
			</div>

			<div className="flex flex-col gap-2">
				{rooms.map((room) => (
					<button
						key={room.roomId}
						type="button"
						onClick={() => handleRoomClick(room)}
						className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<MessageSquare className="size-4" />
						</span>
						<span
							className={
								room.roomName
									? "min-w-0 flex-1 truncate font-medium text-sm"
									: "min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs"
							}
							title={room.roomId}
						>
							{room.roomName ?? room.roomId}
						</span>
						<Badge variant="secondary" className="shrink-0">
							{room.runCount}{" "}
							{room.runCount === 1 ? "run" : "runs"}
						</Badge>
						<div className="flex shrink-0 items-center gap-1.5 text-muted-foreground text-xs">
							<Clock className="size-3.5 shrink-0" />
							{room.mostRecentCompletedAt
								? formatDateToRelative(
										room.mostRecentCompletedAt,
									)
								: "N/A"}
						</div>
						<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</button>
				))}
			</div>
		</div>
	);
};
