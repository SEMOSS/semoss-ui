import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { getAutomationRun } from "../../../api";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
	RunStatus,
} from "../../../domain/automation.types";
import {
	formatTimestamp,
	getStatusClasses,
} from "../../../domain/automation-display";
import { normalizeAutomationErrorMessage } from "../../../domain/automation-utils";
import { StatusBadge } from "../../status-badge";
import {
	buildDashboardRows,
	type DashboardRow,
	type LoopRowKey,
	loopRowKey,
} from "./run-dashboard-rows";
import { getRunScopeVariableRows } from "./run-node-view-state";

interface RunHistoryDashboardProps {
	appId: string;
	/** The run page already loaded by the history list — no separate backend fetch for the top-level list. */
	runs: AutomationRunSummary[];
	onOutputPopout: (output: string) => void;
}

const ROW_HEIGHT = 36;
const GRID_COLUMNS = "grid-cols-[28px_52px_150px_150px_1fr]";
type DetailTab = "incoming" | "outgoing" | "variables";

interface SelectedNode {
	key: string;
	label: string;
	result: AutomationNodeResult;
}

/**
 * Mirth Connect message-browser-style dashboard: one row per run, expandable
 * into one row per node, and (for loop nodes) further expandable into one row
 * per loop iteration — so a 5000-iteration loop contributes 5000 rows.
 */
export function RunHistoryDashboard({
	appId,
	runs,
	onOutputPopout,
}: RunHistoryDashboardProps) {
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

	const [selected, setSelected] = useState<SelectedNode | null>(null);
	const [detailTab, setDetailTab] = useState<DetailTab>("incoming");

	const selectNode = useCallback(
		(key: string, label: string, result: AutomationNodeResult | null) => {
			if (!result) return;
			setSelected({ key, label, result });
			setDetailTab("incoming");
		},
		[],
	);

	const closeDetail = useCallback(() => setSelected(null), []);

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
		<div className="flex h-full min-h-0 gap-2">
			<div className="flex h-full min-h-0 flex-1 flex-col rounded-lg border bg-card">
				<div
					className={`grid ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/50 px-3 py-2 text-muted-foreground text-xs uppercase tracking-wide`}
				>
					<span />
					<span>ID</span>
					<span>Time Started</span>
					<span>Time Ended</span>
					<span>Status</span>
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
							{rowVirtualizer
								.getVirtualItems()
								.map((virtualRow) => {
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
												selectedKey={
													selected?.key ?? null
												}
												onToggleRun={toggleRun}
												onToggleLoop={toggleLoop}
												onRetry={fetchDetailIfNeeded}
												onSelectNode={selectNode}
											/>
										</div>
									);
								})}
						</div>
					</div>
				)}
			</div>

			{selected ? (
				<NodeDetailPanel
					selected={selected}
					detailTab={detailTab}
					onChangeTab={setDetailTab}
					onClose={closeDetail}
					onOutputPopout={onOutputPopout}
				/>
			) : null}
		</div>
	);
}

function DashboardRowView({
	row,
	selectedKey,
	onToggleRun,
	onToggleLoop,
	onRetry,
	onSelectNode,
}: {
	row: DashboardRow;
	selectedKey: string | null;
	onToggleRun: (runId: string) => void;
	onToggleLoop: (runId: string, nodeId: string) => void;
	onRetry: (runId: string) => void;
	onSelectNode: (
		key: string,
		label: string,
		result: AutomationNodeResult | null,
	) => void;
}) {
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
				<span className="text-muted-foreground tabular-nums">
					{row.runNumber}
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
				<span className="text-muted-foreground">
					{formatTimestamp(row.run.STARTED_AT)}
				</span>
				<span className="text-muted-foreground">
					{row.run.COMPLETED_AT
						? formatTimestamp(row.run.COMPLETED_AT)
						: "—"}
				</span>
				<span>
					<RunOutcomeBadge status={row.run.STATUS} />
				</span>
			</div>
		);
	}

	if (row.kind === "node") {
		const nodeLabel = row.node.NODE_LABEL || row.node.NODE_ID;
		const isSelected = row.key === selectedKey;
		return (
			<div
				className={`grid h-full ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/20 px-3 text-xs ${isSelected ? "bg-accent/50" : ""}`}
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
				<button
					type="button"
					onClick={() => onSelectNode(row.key, nodeLabel, row.node)}
					className="col-span-3 w-full truncate pl-5 text-left hover:bg-muted/40"
				>
					{nodeLabel}
				</button>
				<span>
					<StatusBadge status={row.node.STATUS} />
				</span>
			</div>
		);
	}

	const isSelected = row.key === selectedKey;
	const iterationLabel = `${row.nodeLabel} · Item ${row.iterationIndex + 1}`;
	const statusCell = (
		<span>{row.status ? <StatusBadge status={row.status} /> : "—"}</span>
	);

	if (row.result) {
		const result = row.result;
		return (
			<button
				type="button"
				onClick={() => onSelectNode(row.key, iterationLabel, result)}
				className={`grid h-full w-full ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/10 px-3 text-left text-xs hover:bg-muted/30 ${isSelected ? "bg-accent/50" : ""}`}
			>
				<span />
				<span />
				<span />
				<span />
				{statusCell}
			</button>
		);
	}

	return (
		<div
			className={`grid h-full ${GRID_COLUMNS} items-center gap-2 border-b bg-muted/10 px-3 text-xs`}
		>
			<span />
			<span />
			<span />
			<span />
			{statusCell}
		</div>
	);
}

function RunOutcomeBadge({ status }: { status: RunStatus }) {
	if (status === "SUCCESS") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-[11px] ${getStatusClasses(status)}`}
			>
				Success
			</span>
		);
	}
	if (status === "FAILED") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-[11px] ${getStatusClasses(status)}`}
			>
				Failure
			</span>
		);
	}
	// Not yet resolved (still running, cancelled, etc.) — neither success nor failure.
	return <StatusBadge status={status} />;
}

function isDetailTab(value: string): value is DetailTab {
	return (
		value === "incoming" || value === "outgoing" || value === "variables"
	);
}

/** Pretty-prints JSON payloads for readability; falls back to the raw string, or null when there's nothing retained. */
function formatMessageValue(value: string | null | undefined): string | null {
	if (!value) return null;
	try {
		return JSON.stringify(JSON.parse(value) as unknown, null, 2);
	} catch {
		return value;
	}
}

function NodeDetailPanel({
	selected,
	detailTab,
	onChangeTab,
	onClose,
	onOutputPopout,
}: {
	selected: SelectedNode;
	detailTab: DetailTab;
	onChangeTab: (tab: DetailTab) => void;
	onClose: () => void;
	onOutputPopout: (output: string) => void;
}) {
	const incomingText =
		formatMessageValue(selected.result.inputPayload) ??
		"No incoming message was retained for this node.";
	const outgoingText =
		formatMessageValue(
			selected.result.OUTPUT_PREVIEW ??
				selected.result.OUTPUT_VALUE ??
				selected.result.ERROR_MESSAGE,
		) ?? "No outgoing message was retained for this node.";
	const variableRows = getRunScopeVariableRows(selected.result.scopeSnapshot);

	return (
		<section className="flex h-full w-96 shrink-0 flex-col rounded-lg border bg-card">
			<div className="flex items-center justify-between gap-2 border-b px-3 py-2">
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">
						{selected.label}
					</p>
					<p className="truncate text-muted-foreground text-xs">
						{selected.result.NODE_ID}
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close node detail"
					className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			</div>
			<Tabs
				value={detailTab}
				onValueChange={(value) => {
					if (isDetailTab(value)) onChangeTab(value);
				}}
				className="flex min-h-0 flex-1 flex-col"
			>
				<TabsList className="mx-3 mt-3 w-fit">
					<TabsTrigger value="incoming">Incoming</TabsTrigger>
					<TabsTrigger value="outgoing">Outgoing</TabsTrigger>
					<TabsTrigger value="variables">Variable Map</TabsTrigger>
				</TabsList>
				<TabsContent
					value="incoming"
					className="min-h-0 flex-1 overflow-y-auto p-3"
				>
					<CellOutputBlock
						output={incomingText}
						onOutputPopout={() => onOutputPopout(incomingText)}
					/>
				</TabsContent>
				<TabsContent
					value="outgoing"
					className="min-h-0 flex-1 overflow-y-auto p-3"
				>
					<CellOutputBlock
						output={outgoingText}
						onOutputPopout={() => onOutputPopout(outgoingText)}
					/>
				</TabsContent>
				<TabsContent
					value="variables"
					className="min-h-0 flex-1 overflow-y-auto p-3"
				>
					{variableRows && variableRows.length > 0 ? (
						<Table
							className="text-xs"
							wrapperClassName="overflow-visible"
						>
							<TableHeader className="sticky top-0 bg-muted">
								<TableRow>
									<TableHead className="h-auto py-1.5">
										Name
									</TableHead>
									<TableHead className="h-auto py-1.5">
										Value
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{variableRows.map((row) => (
									<TableRow key={row.name}>
										<TableCell className="align-top font-medium">
											{row.name}
										</TableCell>
										<TableCell className="break-words align-top">
											{row.value}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<CellOutputBlock
							output="No variable snapshot was retained for this node."
							onOutputPopout={() =>
								onOutputPopout(
									"No variable snapshot was retained for this node.",
								)
							}
						/>
					)}
				</TabsContent>
			</Tabs>
		</section>
	);
}
