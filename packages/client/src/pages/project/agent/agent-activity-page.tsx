import { ArrowLeft, ChevronRight, Clock, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Skeleton, toast } from "@semoss/ui/next";
import { useProject, useRootStore } from "@/hooks";
import { formatDateToRelative } from "@/utility/date";
import type {
	AgentActivityLogResponse,
	AgentActivityRun,
	AgentRunDetail,
	RoomRunDetail,
	RoomSummary,
	SubagentRun,
	SubagentRunNode,
} from "./agent-activity-types";
import { toMs } from "./agent-activity-types";
import { AgentRunGraph } from "./agent-run-graph";

const MAX_SUBAGENT_DEPTH = 5;

const summarizeRoom = (
	roomId: string,
	runs: AgentActivityRun[],
): RoomSummary => {
	let mostRecentCompletedAt: string | null = null;
	let mostRecentCompletedMs = -Infinity;
	let sortMs = -Infinity;

	for (const run of runs) {
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

	return { roomId, runCount: runs.length, mostRecentCompletedAt, sortMs };
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

	const [activity, setActivity] = useState<AgentActivityLogResponse>({});
	const [loading, setLoading] = useState(true);

	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [selectedRoomRuns, setSelectedRoomRuns] = useState<RoomRunDetail[]>(
		[],
	);
	const [loadingRunDetails, setLoadingRunDetails] = useState(false);

	useEffect(() => {
		const agentId = project.project_id;
		if (!agentId) {
			return;
		}

		let cancelled = false;

		const fetchActivity = async () => {
			setLoading(true);
			try {
				const response = await monolithStore.runQuery<
					[AgentActivityLogResponse]
				>(
					`GetAgentActivityLog(agentId=["${agentId}"], limit=[20], sortByRoom=[true]);`,
				);
				const { operationType, output } = response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1) {
					throw new Error(String(output));
				}
				if (!cancelled) {
					setActivity(output ?? {});
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

		fetchActivity();

		return () => {
			cancelled = true;
		};
	}, [project.project_id, monolithStore]);

	const rooms = useMemo(() => {
		return Object.entries(activity)
			.map(([roomId, runs]) => summarizeRoom(roomId, runs))
			.sort((a, b) => b.sortMs - a.sortMs);
	}, [activity]);

	const fetchRunDetail = async (runId: string): Promise<AgentRunDetail> => {
		const response = await monolithStore.runQuery<[AgentRunDetail]>(
			`GetAgentRun ( runId = "${runId}" , includeMessages = "true" ) ;`,
		);
		const { operationType, output } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			throw new Error(String(output));
		}
		return output;
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
		depth = 0,
	): Promise<SubagentRunNode[]> => {
		if (depth >= MAX_SUBAGENT_DEPTH) {
			return [];
		}
		const response = await monolithStore.runQuery<[SubagentRun[]]>(
			`GetSubagentRuns ( runId = "${runId}" ) ;`,
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
					fetchSubagentRunTree(run.runId, visited, depth + 1),
				]);
				const base = detail ?? { ...run, messages: [] };
				return { ...base, children };
			}),
		);
	};

	const handleRoomClick = async (room: RoomSummary) => {
		const allRuns = activity[room.roomId] ?? [];
		// Runs with a parent in this room render nested under it via
		// GetSubagentRuns, so only root the ones whose parent is elsewhere.
		const roomRunIds = new Set(allRuns.map((run) => run.runId));
		const runs = allRuns.filter(
			(run) => !run.parentRunId || !roomRunIds.has(run.parentRunId),
		);

		setSelectedRoomId(room.roomId);
		setSelectedRoomRuns([]);
		setLoadingRunDetails(true);

		try {
			const visited = new Set(runs.map((run) => run.runId));
			const runDetails = await Promise.all(
				runs.map(async (run) => {
					const [detail, subagents] = await Promise.all([
						fetchRunDetail(run.runId),
						fetchSubagentRunTree(run.runId, visited),
					]);
					return { ...detail, subagents };
				}),
			);
			setSelectedRoomRuns(runDetails);
		} catch (error) {
			console.error("Error fetching agent run:", error);
			toast.error(`Error fetching agent run: ${error}`);
		} finally {
			setLoadingRunDetails(false);
		}
	};

	const handleBackToList = () => {
		setSelectedRoomId(null);
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

	if (rooms.length === 0) {
		return (
			<div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
				<MessageSquare className="size-8 opacity-50" />
				<p className="text-sm">No activity yet for this agent.</p>
			</div>
		);
	}

	if (selectedRoomId) {
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
					<div>
						<h6 className="font-mono font-semibold text-sm">
							{selectedRoomId}
						</h6>
						<p className="text-muted-foreground text-xs">
							Execution graph of agent runs, sub-agents, and tool
							calls in this room.
						</p>
					</div>
				</div>

				{loadingRunDetails ? (
					<Skeleton className="h-[600px] w-full rounded-xl" />
				) : selectedRoomRuns.length > 0 ? (
					<AgentRunGraph
						key={selectedRoomId}
						roomId={selectedRoomId}
						runs={selectedRoomRuns}
					/>
				) : (
					<p className="text-muted-foreground text-sm">
						No run data available.
					</p>
				)}
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
							className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs"
							title={room.roomId}
						>
							{room.roomId}
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
