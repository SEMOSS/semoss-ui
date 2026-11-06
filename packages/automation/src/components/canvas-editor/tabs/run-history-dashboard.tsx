import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAutomationRun } from "../../../api";
import type {
	AutomationRunDetail,
	AutomationRunSummary,
} from "../../../domain/automation.types";
import {
	formatRelativeTime,
	formatRunDuration,
} from "../../../domain/automation-display";
import {
	formatDurationMs,
	normalizeAutomationErrorMessage,
} from "../../../domain/automation-utils";
import { StatusBadge } from "../../status-badge";
import {
	buildDashboardRows,
	type DashboardRow,
	type LoopRowKey,
	loopRowKey,
} from "./run-dashboard-rows";

interface RunHistoryDashboardProps {
	appId: string;
	/** The run page already loaded by the history list — no separate backend fetch for the top-level list. */
	runs: AutomationRunSummary[];
}

const ROW_HEIGHT = 36;
const GRID_COLUMNS = "grid-cols-[28px_1fr_120px_110px_90px]";

/**
 * Mirth Connect message-browser-style dashboard: one row per run, expandable
 * into one row per node, and (for loop nodes) further expandable into one row
 * per loop iteration — so a 5000-iteration loop contributes 5000 rows.
 */
export function RunHistoryDashboard({ appId, runs }: RunHistoryDashboardProps) {
	const isMountedRef = useRef(true);
	useEffect(
		() => () => {
			isMountedRef.current = false;
		},
		[],
	);

	const [expandedRunIds, setExpandedRunIds] = useState<Set<string>>(
		new Set(),
	);
	const [expandedLoopKeys, setExpandedLoopKeys] = useState<Set<LoopRowKey>>(
		new Set(),
	);
	const [runDetails, setRunDetails] = useState<
		Map<string, AutomationRunDetail>
	>(new Map());
	const [loadingRunIds, setLoadingRunIds] = useState<Set<string>>(new Set());
	const [runErrors, setRunErrors] = useState<Map<string, string>>(new Map());

	const fetchDetailIfNeeded = useCallback(
		(runId: string) => {
			if (runDetails.has(runId) || loadingRunIds.has(runId)) return;
			setLoadingRunIds((prev) => new Set(prev).add(runId));
			setRunErrors((prev) => {
				if (!prev.has(runId)) return prev;
				const next = new Map(prev);
				next.delete(runId);
				return next;
			});
			getAutomationRun(appId, runId)
				.then((detail) => {
					if (!isMountedRef.current) return;
					setRunDetails((prev) => new Map(prev).set(runId, detail));
				})
				.catch((error: unknown) => {
					if (!isMountedRef.current) return;
					setRunErrors((prev) =>
						new Map(prev).set(
							runId,
							error instanceof Error
								? normalizeAutomationErrorMessage(error.message)
								: "Unable to load run details.",
						),
					);
				})
				.finally(() => {
					if (!isMountedRef.current) return;
					setLoadingRunIds((prev) => {
						const next = new Set(prev);
						next.delete(runId);
						return next;
					});
				});
		},
		[appId, runDetails, loadingRunIds],
	);

	const toggleRun = useCallback(
		(runId: string) => {
			setExpandedRunIds((prev) => {
				const next = new Set(prev);
				if (next.has(runId)) {
					next.delete(runId);
				} else {
					next.add(runId);
					fetchDetailIfNeeded(runId);
				}
				return next;
			});
		},
		[fetchDetailIfNeeded],
	);

	const toggleLoop = useCallback((runId: string, nodeId: string) => {
		const key = loopRowKey(runId, nodeId);
		setExpandedLoopKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}, []);

	const rows = useMemo(
		() =>
			buildDashboardRows({
				runs,
				expandedRunIds,
				runDetails,
				loadingRunIds,
				runErrors,
				expandedLoopKeys,
			}),
		[
			runs,
			expandedRunIds,
			runDetails,
			loadingRunIds,
			runErrors,
			expandedLoopKeys,
		],
	);

	const parentRef = useRef<HTMLDivElement>(null);
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 16,
	});

	return (
		<div className="flex h-full min-h-0 flex-col rounded-lg border bg-card">
			<div
				className={`grid ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/50 px-3 py-2 text-muted-foreground text-xs uppercase tracking-wide`}
			>
				<span />
				<span>Run / Node / Iteration</span>
				<span>Status</span>
				<span>Started</span>
				<span className="text-right">Duration</span>
			</div>

			{runs.length === 0 ? (
				<div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-muted-foreground text-xs">
					No runs yet.
				</div>
			) : (
				<div
					ref={parentRef}
					className="relative min-h-0 flex-1 overflow-y-auto"
				>
					<div
						style={{
							height: rowVirtualizer.getTotalSize(),
							width: "100%",
							position: "relative",
						}}
					>
						{rowVirtualizer.getVirtualItems().map((virtualRow) => {
							const row = rows[virtualRow.index];
							return (
								<div
									key={row.key}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										height: ROW_HEIGHT,
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									<DashboardRowView
										row={row}
										onToggleRun={toggleRun}
										onToggleLoop={toggleLoop}
										onRetry={fetchDetailIfNeeded}
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

function DashboardRowView({
	row,
	onToggleRun,
	onToggleLoop,
	onRetry,
}: {
	row: DashboardRow;
	onToggleRun: (runId: string) => void;
	onToggleLoop: (runId: string, nodeId: string) => void;
	onRetry: (runId: string) => void;
}) {
	const indentClass =
		row.depth === 0 ? "" : row.depth === 1 ? "pl-5" : "pl-10";

	if (row.kind === "run") {
		return (
			<div
				className={`grid h-full ${GRID_COLUMNS} items-center gap-2 border-b px-3 text-xs`}
			>
				<button
					type="button"
					onClick={() => onToggleRun(row.run.RUN_ID)}
					aria-label={row.expanded ? "Collapse run" : "Expand run"}
					className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted"
				>
					{row.loading ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<ChevronRight
							className={`h-3.5 w-3.5 transition-transform ${row.expanded ? "rotate-90" : ""}`}
						/>
					)}
				</button>
				<span className={`truncate font-medium ${indentClass}`}>
					Run {row.run.RUN_ID.slice(0, 8)}
					{row.loadError ? (
						<button
							type="button"
							onClick={() => onRetry(row.run.RUN_ID)}
							className="ml-2 text-red-600 underline"
						>
							{row.loadError} · Retry
						</button>
					) : null}
				</span>
				<span>
					<StatusBadge status={row.run.STATUS} />
				</span>
				<span className="text-muted-foreground">
					{formatRelativeTime(row.run.STARTED_AT)}
				</span>
				<span className="text-right tabular-nums">
					{formatRunDuration(
						row.run.STARTED_AT,
						row.run.COMPLETED_AT,
					)}
				</span>
			</div>
		);
	}

	if (row.kind === "node") {
		return (
			<div
				className={`grid h-full ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/20 px-3 text-xs`}
			>
				{row.isLoop ? (
					<button
						type="button"
						onClick={() =>
							onToggleLoop(row.runId, row.node.NODE_ID)
						}
						aria-label={
							row.expanded ? "Collapse loop" : "Expand loop"
						}
						className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted"
					>
						<ChevronRight
							className={`h-3.5 w-3.5 transition-transform ${row.expanded ? "rotate-90" : ""}`}
						/>
					</button>
				) : (
					<span />
				)}
				<span className={`truncate ${indentClass}`}>
					{row.node.NODE_LABEL || row.node.NODE_ID}
					{row.isLoop ? (
						<span className="ml-2 text-muted-foreground">
							· {row.iterationCount} iteration
							{row.iterationCount === 1 ? "" : "s"}
						</span>
					) : null}
				</span>
				<span>
					<StatusBadge status={row.node.STATUS} />
				</span>
				<span />
				<span className="text-right tabular-nums">
					{row.isLoop ? "—" : formatDurationMs(row.node.DURATION_MS)}
				</span>
			</div>
		);
	}

	return (
		<div
			className={`grid h-full ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/10 px-3 text-xs`}
		>
			<span />
			<span className={`truncate text-muted-foreground ${indentClass}`}>
				{row.nodeLabel} · Item {row.iterationIndex + 1}
				<span className="ml-2">
					· {row.stepCount} step{row.stepCount === 1 ? "" : "s"}
				</span>
			</span>
			<span>
				{row.status ? <StatusBadge status={row.status} /> : "—"}
			</span>
			<span />
			<span className="text-right tabular-nums">
				{formatDurationMs(row.durationMs)}
			</span>
		</div>
	);
}
