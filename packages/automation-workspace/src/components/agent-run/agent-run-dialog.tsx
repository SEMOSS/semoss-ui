import {
	AlertCircle,
	Bot,
	CheckCircle2,
	Loader2,
	RefreshCw,
	Square,
	XCircle,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { AgentRunSnapshot, PendingAgentAction } from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Code,
	CodeContainer,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
} from "@semoss/ui/next";
import type { AutomationNodeTrace } from "../../domain/automation.types";
import { useAgentRunCoordinator } from "../../hooks";
import type {
	AutomationAgentRunActivity,
	AutomationAgentRunSelection,
	AutomationAgentRunToolGroup,
} from "./agent-run.types";
import {
	agentRunStatusClass,
	agentRunStatusLabel,
	isActiveToolInvocationStatus,
	isTerminalAgentRunStatus,
	toolGroupStatus,
} from "./agent-run.utils";
import {
	AgentRunActionCard,
	type AgentRunActionDecision,
} from "./agent-run-action-card";
import {
	AgentRunGraph,
	collectAgentRunActivities,
	groupToolActivities,
} from "./agent-run-graph";

interface AgentRunDialogProps {
	open: boolean;
	projectId: string;
	trace: AutomationNodeTrace | null;
	onOpenChange: (open: boolean) => void;
}

const messageText = (activity: AutomationAgentRunActivity): string =>
	activity.text || activity.output || activity.error || activity.label;

/** Returns null for a tool group — it gets its own per-call breakdown instead. */
const detailsForSelection = (
	selection: AutomationAgentRunSelection,
	snapshot: AgentRunSnapshot,
	trace: AutomationNodeTrace | null,
): { title: string; content: string; language: "json" | "text" } | null => {
	if (selection.kind === "toolGroup") {
		return null;
	}
	if (selection.kind === "room") {
		return {
			title: "Agent room",
			content: JSON.stringify(
				{ roomId: snapshot.roomId, runId: snapshot.runId },
				null,
				2,
			),
			language: "json",
		};
	}
	if (selection.kind === "run") {
		return {
			title: "Agent run",
			content: JSON.stringify(
				{
					runId: snapshot.runId,
					roomId: snapshot.roomId,
					workspaceId: trace?.workspaceId,
					status: snapshot.status,
					finalText: snapshot.finalText,
					errorMessage: snapshot.errorMessage,
				},
				null,
				2,
			),
			language: "json",
		};
	}

	const { activity } = selection;
	if (activity.arguments) {
		return {
			title: activity.label,
			content: JSON.stringify(
				{
					status: activity.status,
					arguments: activity.arguments,
					output: activity.output,
					error: activity.error,
				},
				null,
				2,
			),
			language: "json",
		};
	}
	return {
		title: activity.label,
		content: messageText(activity),
		language: "text",
	};
};

/** Every call made to this tool, in order, with the in-flight one highlighted. */
const ToolGroupDetail = ({ group }: { group: AutomationAgentRunToolGroup }) => (
	<div>
		<div className="flex items-center justify-between gap-2">
			<p className="font-medium text-sm">{group.toolName}</p>
			<span className="rounded-full bg-muted px-1.5 text-xs">
				{group.invocations.length}{" "}
				{group.invocations.length === 1 ? "call" : "calls"}
			</span>
		</div>
		<div className="mt-2 max-h-72 space-y-2 overflow-auto">
			{group.invocations.map((call, index) => {
				const isActive = isActiveToolInvocationStatus(call.status);
				const isFailed = Boolean(
					call.status && /error|fail/i.test(call.status),
				);
				return (
					<div
						key={call.id}
						className={cn(
							"rounded-lg border p-2",
							isActive && "border-primary/60 bg-primary/5",
						)}
					>
						<div className="flex items-center justify-between gap-2 text-xs">
							<span className="font-medium text-muted-foreground">
								Call {index + 1}
							</span>
							{isActive ? (
								<span className="flex items-center gap-1 text-primary">
									<Loader2
										className="size-3.5 animate-spin"
										aria-hidden
									/>
									Active
								</span>
							) : isFailed ? (
								<XCircle
									className="size-3.5 text-destructive"
									aria-hidden
								/>
							) : (
								<CheckCircle2
									className="size-3.5 text-success"
									aria-hidden
								/>
							)}
						</div>
						<CodeContainer className="mt-1.5 max-h-40 overflow-auto bg-muted">
							<Code
								code={JSON.stringify(
									{
										arguments: call.arguments,
										output: call.output,
										error: call.error,
									},
									null,
									2,
								)}
								language="json"
								className="text-xs"
							/>
						</CodeContainer>
					</div>
				);
			})}
		</div>
	</div>
);

/**
 * Automation-local durable agent run inspector.
 */
export function AgentRunDialog({
	open,
	projectId,
	trace,
	onOpenChange,
}: AgentRunDialogProps) {
	const runId = trace?.agentRunId?.trim() ?? "";
	const automationRunId = trace?.automationRunId?.trim() ?? "";
	const nodeId = trace?.nodeId?.trim() ?? "";
	const traceKey = `${projectId}:${automationRunId}:${nodeId}:${runId}`;
	const [selectedId, setSelectedId] = useState("run");
	const [resolvingActionIds, setResolvingActionIds] = useState<Set<string>>(
		new Set(),
	);
	const [resolvedActionIds, setResolvedActionIds] = useState<Set<string>>(
		new Set(),
	);
	const [stopping, setStopping] = useState(false);
	const [confirmStop, setConfirmStop] = useState(false);
	const connectedTraceRef = useRef<string | null>(null);
	const activityHeadingId = useId();
	const actionHeadingId = useId();
	const {
		snapshot,
		messages,
		items,
		loading,
		loadError,
		liveError,
		refresh,
		decide,
		cancel,
	} = useAgentRunCoordinator({
		open,
		projectId,
		automationRunId,
		nodeId,
		agentRunId: runId,
	});

	useEffect(() => {
		setSelectedId("run");
		if (connectedTraceRef.current === traceKey) {
			return;
		}
		connectedTraceRef.current = traceKey;
		setResolvingActionIds(new Set());
		setResolvedActionIds(new Set());
	}, [traceKey]);

	const activities = useMemo(
		() =>
			snapshot
				? collectAgentRunActivities({
						snapshot,
						items,
						messages,
					})
				: [],
		[items, messages, snapshot],
	);
	const toolGroups = useMemo(
		() => groupToolActivities(activities),
		[activities],
	);
	const selection = useMemo<AutomationAgentRunSelection>(() => {
		if (selectedId === "room") {
			return { id: "room", kind: "room" };
		}
		if (selectedId === "run") {
			return { id: "run", kind: "run" };
		}
		const group = toolGroups.find(
			(item) => item.kind === "toolGroup" && item.id === selectedId,
		);
		if (group?.kind === "toolGroup") {
			return { id: group.id, kind: "toolGroup", group: group.group };
		}
		const activity = activities.find((item) => item.id === selectedId);
		return activity
			? { id: activity.id, kind: "activity", activity }
			: { id: "run", kind: "run" };
	}, [activities, toolGroups, selectedId]);
	const selectionDetails = snapshot
		? detailsForSelection(selection, snapshot, trace)
		: null;
	const active =
		snapshot !== null && !isTerminalAgentRunStatus(snapshot.status);
	const canControl = snapshot?.canControl === true;

	const resolveAction = useCallback(
		async (
			action: PendingAgentAction,
			decision: AgentRunActionDecision,
			paramValues?: Record<string, unknown>,
		) => {
			if (!canControl || resolvingActionIds.has(action.actionId)) {
				return;
			}
			setResolvingActionIds((current) =>
				new Set(current).add(action.actionId),
			);
			try {
				if (decision === "reject") {
					await decide(action, "reject");
				} else if (decision === "respond") {
					await decide(action, "respond", paramValues);
				} else if (decision === "edit") {
					await decide(action, "edit", paramValues);
				} else {
					await decide(action, "approve");
				}
				setResolvedActionIds((current) =>
					new Set(current).add(action.actionId),
				);
			} finally {
				setResolvingActionIds((current) => {
					const next = new Set(current);
					next.delete(action.actionId);
					return next;
				});
			}
		},
		[canControl, decide, resolvingActionIds],
	);

	const stopRun = useCallback(async () => {
		if (!active || !canControl) {
			return;
		}
		setStopping(true);
		try {
			await cancel();
			setConfirmStop(false);
		} catch {
			return;
		} finally {
			setStopping(false);
		}
	}, [active, canControl, cancel]);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-6xl p-0 sm:max-w-6xl">
					<DialogHeader className="border-border border-b px-4 py-3">
						<div className="flex flex-wrap items-center justify-between gap-3 pr-8">
							<div className="min-w-0">
								<DialogTitle className="flex items-center gap-2">
									<Bot className="size-5" aria-hidden />
									Agent run
								</DialogTitle>
								<DialogDescription className="mt-1 truncate">
									{runId || "Agent run trace unavailable"}
								</DialogDescription>
							</div>
							{snapshot ? (
								<span
									className={`rounded-md border px-2 py-1 text-xs ${agentRunStatusClass(snapshot.status)}`}
								>
									{agentRunStatusLabel(snapshot.status)}
								</span>
							) : null}
						</div>
					</DialogHeader>

					<div className="space-y-4 p-4">
						{!runId || !automationRunId || !nodeId ? (
							<Alert variant="destructive">
								<AlertCircle aria-hidden />
								<AlertTitle>Missing agent run trace</AlertTitle>
								<AlertDescription>
									This automation result does not include the
									durable run and node context needed to
									inspect the agent run.
								</AlertDescription>
							</Alert>
						) : null}
						{loadError ? (
							<Alert variant="destructive">
								<AlertCircle aria-hidden />
								<AlertTitle>
									Unable to load agent run
								</AlertTitle>
								<AlertDescription>
									{loadError}
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="mt-2"
										onClick={refresh}
									>
										<RefreshCw
											className="size-4"
											aria-hidden
										/>
										Retry
									</Button>
								</AlertDescription>
							</Alert>
						) : null}
						{liveError && !loadError ? (
							<Alert>
								<AlertCircle aria-hidden />
								<AlertTitle>
									Live updates need attention
								</AlertTitle>
								<AlertDescription>{liveError}</AlertDescription>
							</Alert>
						) : null}

						{/* Rendered first (before the graph) so it's visible without
						    scrolling — this is the reason most people open the dialog. */}
						{snapshot?.pendingActions?.length ? (
							<section aria-labelledby={actionHeadingId}>
								<p
									id={actionHeadingId}
									className="font-medium text-sm"
								>
									Action required
								</p>
								<div className="mt-2 space-y-2">
									{snapshot.pendingActions.map((action) => (
										<AgentRunActionCard
											key={action.actionId}
											action={action}
											canResolve={canControl}
											resolving={resolvingActionIds.has(
												action.actionId,
											)}
											resolved={resolvedActionIds.has(
												action.actionId,
											)}
											onResolve={resolveAction}
										/>
									))}
								</div>
							</section>
						) : null}

						{loading ? (
							<div className="flex h-96 items-center justify-center gap-2 text-muted-foreground text-sm">
								<Spinner className="size-5" />
								Loading durable agent history…
							</div>
						) : snapshot ? (
							<div className="grid gap-4 lg:grid-cols-5">
								<section
									className="min-w-0 lg:col-span-3"
									aria-label="Agent run graph"
								>
									<AgentRunGraph
										snapshot={snapshot}
										items={items}
										messages={messages}
										selectedId={selection.id}
										onSelect={setSelectedId}
									/>
								</section>
								<aside className="min-w-0 space-y-4 lg:col-span-2">
									<section
										className="rounded-lg border border-border bg-card p-3"
										aria-live="polite"
									>
										{selection.kind === "toolGroup" ? (
											<ToolGroupDetail
												group={selection.group}
											/>
										) : (
											<>
												<p className="font-medium text-sm">
													{selectionDetails?.title}
												</p>
												{selectionDetails ? (
													<CodeContainer className="mt-2 max-h-48 overflow-auto bg-muted">
														<Code
															code={
																selectionDetails.content
															}
															language={
																selectionDetails.language
															}
															className="text-xs"
														/>
													</CodeContainer>
												) : null}
											</>
										)}
									</section>
									<section
										aria-labelledby={activityHeadingId}
									>
										<p
											id={activityHeadingId}
											className="font-medium text-sm"
										>
											Activity
										</p>
										<div className="mt-2 max-h-64 space-y-1 overflow-auto rounded-lg border border-border p-2">
											{toolGroups.length === 0 ? (
												<p className="p-2 text-muted-foreground text-xs">
													No activity has been
													recorded yet.
												</p>
											) : (
												toolGroups.map((item) => {
													const label =
														item.kind ===
														"toolGroup"
															? item.group
																	.toolName
															: item.activity
																	.label;
													const status =
														item.kind ===
														"toolGroup"
															? toolGroupStatus(
																	item.group,
																)
															: item.activity
																	.status;
													return (
														<button
															key={item.id}
															type="button"
															onClick={() =>
																setSelectedId(
																	item.id,
																)
															}
															className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
																selection.id ===
																item.id
																	? "bg-accent text-accent-foreground"
																	: "hover:bg-muted"
															}`}
														>
															<span className="min-w-0 flex-1">
																<span className="block truncate font-medium">
																	{label}
																</span>
																{status ? (
																	<span className="text-muted-foreground">
																		{agentRunStatusLabel(
																			status,
																		)}
																	</span>
																) : null}
															</span>
															{item.kind ===
																"toolGroup" &&
																item.group
																	.invocations
																	.length >
																	1 && (
																	<span className="shrink-0 rounded-full bg-muted px-1.5 text-[10px]">
																		{
																			item
																				.group
																				.invocations
																				.length
																		}
																	</span>
																)}
														</button>
													);
												})
											)}
										</div>
									</section>
								</aside>
							</div>
						) : null}

						{snapshot?.errorMessage ? (
							<Alert variant="destructive">
								<AlertCircle aria-hidden />
								<AlertTitle>Agent run failed</AlertTitle>
								<AlertDescription>
									{snapshot.errorMessage}
								</AlertDescription>
							</Alert>
						) : null}

						{snapshot && !canControl ? (
							<Alert>
								<AlertCircle aria-hidden />
								<AlertTitle>View-only access</AlertTitle>
								<AlertDescription>
									Only Automation project editors can resolve
									actions or stop this run.
								</AlertDescription>
							</Alert>
						) : null}
					</div>

					<DialogFooter className="border-border border-t px-4 py-3">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={refresh}
							disabled={loading || !runId}
						>
							<RefreshCw className="size-4" aria-hidden />
							Refresh
						</Button>
						{canControl ? (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={() => setConfirmStop(true)}
								disabled={!active || stopping}
							>
								{stopping ? (
									<Spinner className="size-4" />
								) : (
									<Square className="size-4" aria-hidden />
								)}
								Stop run
							</Button>
						) : null}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmStop} onOpenChange={setConfirmStop}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Stop agent run?</DialogTitle>
						<DialogDescription>
							The agent will be interrupted. Any unfinished work
							in this run will be cancelled.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setConfirmStop(false)}
							disabled={stopping}
						>
							Keep running
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => void stopRun()}
							disabled={stopping}
						>
							{stopping ? <Spinner className="size-4" /> : null}
							Stop run
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
