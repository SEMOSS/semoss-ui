import {
	Activity,
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	Clock,
	Wrench,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Spinner } from "@semoss/ui/next";
import { SpanTree } from "@/components/agent-traces";
import type { AgentTraceStep, TraceRow } from "@/components/agent-traces/types";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

const HARNESS_COLORS: Record<string, string> = {
	claude_code:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	room_loop: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
	AskPlayground:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	github_copilot:
		"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	orchestrator:
		"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function getHarnessColor(harness: string): string {
	return (
		HARNESS_COLORS[harness] ??
		"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
	);
}

function formatDuration(ms: number): string {
	if (!ms || ms <= 0) return "—";
	if (ms < 1000) return `${ms}ms`;
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatDateTime(raw: string): string {
	if (!raw) return "—";
	try {
		const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
		const d = new Date(normalized);
		if (Number.isNaN(d.getTime())) return raw;
		return d.toLocaleString();
	} catch {
		return raw;
	}
}

function computeStepDuration(step: AgentTraceStep): number {
	if (step.DURATION_MS != null && step.DURATION_MS > 0)
		return step.DURATION_MS;
	try {
		const s = new Date(step.START_TIME.replace(" ", "T")).getTime();
		const e = new Date(step.END_TIME.replace(" ", "T")).getTime();
		const diff = e - s;
		if (diff === 0) return 500;
		return Number.isNaN(diff) || diff < 0 ? 0 : diff;
	} catch {
		return 0;
	}
}

function computeStepOffset(traceStart: string, stepStart: string): number {
	try {
		const t0 = new Date(traceStart.replace(" ", "T")).getTime();
		const t1 = new Date(stepStart.replace(" ", "T")).getTime();
		const diff = t1 - t0;
		return Number.isNaN(diff) || diff < 0 ? 0 : diff;
	} catch {
		return 0;
	}
}

export const RoomDetailPage = () => {
	const { roomId } = useParams<{ roomId: string }>();
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [traces, setTraces] = useState<TraceRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedTraces, setExpandedTraces] = useState<Set<string>>(
		new Set(),
	);
	const [stepsMap, setStepsMap] = useState<Record<string, AgentTraceStep[]>>(
		{},
	);
	const [_messages, setMessages] = useState<unknown[]>([]);

	const fetchRoomDetail = useCallback(async () => {
		if (!roomId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await monolithStore.runQuery(
				`GetRoomAgentDetail(roomId=["${roomId}"]);`,
			);
			const output = res?.pixelReturn?.[0]?.output;
			if (
				output &&
				typeof output === "object" &&
				!Array.isArray(output)
			) {
				const roomData = output as Record<string, unknown>;
				const roomTraces = (roomData.TRACES ?? []).map(
					(t: Record<string, unknown>) => ({
						TRACE_ID: t.TRACE_ID,
						ROOM_ID: t.ROOM_ID,
						USER_ID: t.USER_ID,
						PROJECT_ID: t.PROJECT_ID,
						HARNESS_NAME: t.HARNESS_NAME,
						STARTED_AT: t.STARTED_AT,
						ENDED_AT: t.ENDED_AT,
						DURATION_MS: t.DURATION_MS ?? 0,
						STATUS: t.STATUS,
						ITERATIONS: t.ITERATIONS ?? 0,
						TOOL_CALL_COUNT: t.TOOL_CALL_COUNT ?? 0,
						TOTAL_INPUT_TOKENS: t.TOTAL_INPUT_TOKENS ?? 0,
						TOTAL_OUTPUT_TOKENS: t.TOTAL_OUTPUT_TOKENS ?? 0,
						USER_PROMPT: t.USER_PROMPT ?? null,
					}),
				);
				setTraces(roomTraces);
				// Pre-populate steps from the server response
				const newStepsMap: Record<string, AgentTraceStep[]> = {};
				for (const t of roomData.TRACES ?? []) {
					if (t.STEPS && t.STEPS.length > 0) {
						newStepsMap[t.TRACE_ID] = t.STEPS as AgentTraceStep[];
					}
				}
				setStepsMap(newStepsMap);
				setMessages(roomData.MESSAGES ?? []);
			}
		} catch (e) {
			setError((e as Error).message ?? "Failed to load room detail");
		} finally {
			setLoading(false);
		}
	}, [roomId, monolithStore]);

	useEffect(() => {
		fetchRoomDetail();
	}, [fetchRoomDetail]);

	const toggleExpand = async (traceId: string) => {
		const next = new Set(expandedTraces);
		if (next.has(traceId)) {
			next.delete(traceId);
		} else {
			next.add(traceId);
		}
		setExpandedTraces(next);
	};

	// Aggregate stats
	const totalRuns = traces.length;
	const totalInputTokens = traces.reduce(
		(s, t) => s + (t.TOTAL_INPUT_TOKENS ?? 0),
		0,
	);
	const totalOutputTokens = traces.reduce(
		(s, t) => s + (t.TOTAL_OUTPUT_TOKENS ?? 0),
		0,
	);
	const totalToolCalls = traces.reduce(
		(s, t) => s + (t.TOOL_CALL_COUNT ?? 0),
		0,
	);
	const totalDuration = traces.reduce((s, t) => s + (t.DURATION_MS ?? 0), 0);
	const projectId = traces[0]?.PROJECT_ID;

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-4 p-6">
				{/* Header */}
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/agents")}
					>
						<ArrowLeft className="mr-2 size-4" />
						Rooms
					</Button>
					<div className="flex flex-col">
						<h1 className="font-bold text-lg">
							{projectId && projectId !== "null"
								? projectId.replace("SYSTEM__", "")
								: `Room ${roomId?.slice(0, 8)}`}
						</h1>
						<span className="font-mono text-muted-foreground text-xs">
							{roomId}
						</span>
					</div>
				</div>

				{error && <p className="text-red-600 text-sm">{error}</p>}

				{/* Summary stats */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="rounded-lg border border-border bg-card p-3">
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Activity className="size-3" />
							Runs
						</div>
						<p className="font-bold text-xl">{totalRuns}</p>
					</div>
					<div className="rounded-lg border border-border bg-card p-3">
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Zap className="size-3" />
							Tokens (In / Out)
						</div>
						<p className="font-bold text-xl">
							<span className="text-green-600 dark:text-green-400">
								{totalInputTokens.toLocaleString()}
							</span>
							{" / "}
							<span className="text-blue-600 dark:text-blue-400">
								{totalOutputTokens.toLocaleString()}
							</span>
						</p>
					</div>
					<div className="rounded-lg border border-border bg-card p-3">
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Wrench className="size-3" />
							Tool Calls
						</div>
						<p className="font-bold text-xl">{totalToolCalls}</p>
					</div>
					<div className="rounded-lg border border-border bg-card p-3">
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Clock className="size-3" />
							Total Time
						</div>
						<p className="font-bold text-xl">
							{formatDuration(totalDuration)}
						</p>
					</div>
				</div>

				{/* Run timeline */}
				<div className="rounded-lg border border-border bg-card">
					<div className="border-border border-b px-4 py-3">
						<h2 className="font-semibold text-sm">
							Run History ({traces.length})
						</h2>
					</div>

					<div className="divide-y divide-border">
						{traces.map((trace) => {
							const isExpanded = expandedTraces.has(
								trace.TRACE_ID,
							);
							const steps = stepsMap[trace.TRACE_ID] ?? [];
							const isSuccess = trace.STATUS === "OK";
							const isRunning = trace.STATUS === "RUNNING";
							const totalMs = trace.DURATION_MS ?? 0;

							return (
								<div key={trace.TRACE_ID}>
									{/* Run row */}
									<button
										type="button"
										className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
										onClick={() =>
											toggleExpand(trace.TRACE_ID)
										}
									>
										{isExpanded ? (
											<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
										) : (
											<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
										)}

										{/* Status dot */}
										<div
											className={`size-2.5 shrink-0 rounded-full ${
												isSuccess
													? "bg-emerald-500"
													: isRunning
														? "animate-pulse bg-blue-500"
														: "bg-red-500"
											}`}
										/>

										{/* Harness pill */}
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[10px] ${getHarnessColor(trace.HARNESS_NAME)}`}
										>
											{trace.HARNESS_NAME}
										</span>

										{/* Time */}
										<span className="text-muted-foreground text-xs">
											{formatDateTime(trace.STARTED_AT)}
										</span>

										{/* Duration */}
										<span className="font-mono text-muted-foreground text-xs">
											{formatDuration(totalMs)}
										</span>

										{/* Tokens */}
										<span className="ml-auto flex items-center gap-1 font-mono text-xs">
											<Zap className="size-3 text-muted-foreground" />
											<span className="text-green-600 dark:text-green-400">
												↑
												{(
													trace.TOTAL_INPUT_TOKENS ??
													0
												).toLocaleString()}
											</span>
											<span className="text-blue-600 dark:text-blue-400">
												↓
												{(
													trace.TOTAL_OUTPUT_TOKENS ??
													0
												).toLocaleString()}
											</span>
										</span>

										{/* Tools */}
										{(trace.TOOL_CALL_COUNT ?? 0) > 0 && (
											<span className="flex items-center gap-1 font-mono text-muted-foreground text-xs">
												<Wrench className="size-3" />
												{trace.TOOL_CALL_COUNT}
											</span>
										)}
									</button>

									{/* Expanded detail */}
									{isExpanded && (
										<div className="border-border/50 border-t bg-muted/20 px-4 py-4">
											{/* User prompt that triggered this run */}
											{(trace as Record<string, unknown>)
												.USER_PROMPT && (
												<div className="mb-3 rounded-md border border-sky-200 bg-sky-50 p-3 dark:border-sky-800 dark:bg-sky-950/30">
													<p className="mb-1 font-semibold text-sky-700 text-xs dark:text-sky-400">
														💬 User Prompt
													</p>
													<p className="text-sky-900 text-sm dark:text-sky-200">
														{
															(
																trace as Record<
																	string,
																	unknown
																>
															).USER_PROMPT
														}
													</p>
												</div>
											)}
											{steps.length > 0 &&
												totalMs > 0 && (
													<div className="mb-4">
														<h3 className="mb-2 font-medium text-xs">
															Waterfall Timeline
														</h3>
														<div className="mr-12 mb-1 ml-24 flex justify-between text-[9px] text-muted-foreground">
															<span>0s</span>
															<span>
																{(
																	totalMs /
																	2000
																).toFixed(1)}
																s
															</span>
															<span>
																{(
																	totalMs /
																	1000
																).toFixed(1)}
																s
															</span>
														</div>
														<div className="space-y-0.5">
															{steps.map(
																(step) => {
																	const stepMs =
																		computeStepDuration(
																			step,
																		);
																	const offsetMs =
																		computeStepOffset(
																			trace.STARTED_AT,
																			step.START_TIME,
																		);
																	const offsetPct =
																		totalMs >
																		0
																			? (offsetMs /
																					totalMs) *
																				100
																			: 0;
																	const widthPct =
																		totalMs >
																		0
																			? Math.max(
																					(stepMs /
																						totalMs) *
																						100,
																					1.5,
																				)
																			: 1.5;
																	const isOk =
																		step.STATUS ===
																		"success";
																	return (
																		<div
																			key={
																				step.STEP_ID
																			}
																			className="flex items-center gap-1"
																		>
																			<span className="w-20 truncate text-right font-mono text-[10px] text-muted-foreground">
																				{
																					step.TOOL_NAME
																				}
																			</span>
																			<div className="relative h-4 flex-1 rounded-sm bg-muted/40">
																				<div className="pointer-events-none absolute inset-0 flex justify-between">
																					{[
																						0,
																						1,
																						2,
																					].map(
																						(
																							i,
																						) => (
																							<div
																								key={
																									i
																								}
																								className="h-full w-px bg-border/40"
																							/>
																						),
																					)}
																				</div>
																				<div
																					className={`absolute top-0.5 bottom-0.5 rounded-sm ${isOk ? "bg-emerald-400/80 dark:bg-emerald-600/60" : "bg-red-400/80 dark:bg-red-600/60"}`}
																					style={{
																						left: `${Math.min(offsetPct, 98)}%`,
																						width: `${Math.min(widthPct, 100 - offsetPct)}%`,
																					}}
																				/>
																			</div>
																			<span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
																				{stepMs >
																				0
																					? stepMs <
																						1000
																						? `${stepMs}ms`
																						: `${(stepMs / 1000).toFixed(1)}s`
																					: "<1s"}
																			</span>
																		</div>
																	);
																},
															)}
														</div>
													</div>
												)}

											{/* Tool steps */}
											{steps.length > 0 ? (
												<div>
													<h3 className="mb-2 font-medium text-xs">
														Tool Steps (
														{steps.length})
													</h3>
													<SpanTree steps={steps} />
												</div>
											) : (
												<p className="text-muted-foreground text-xs">
													No tool steps recorded for
													this run
												</p>
											)}

											{/* Error message */}
											{trace.ERROR_MESSAGE && (
												<div className="mt-3">
													<p className="font-medium text-red-600 text-xs">
														Error
													</p>
													<pre className="mt-1 max-h-20 overflow-auto rounded bg-red-50 p-2 font-mono text-[11px] text-red-700 dark:bg-red-950/30 dark:text-red-400">
														{trace.ERROR_MESSAGE}
													</pre>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}

						{traces.length === 0 && (
							<div className="py-8 text-center text-muted-foreground text-sm">
								No runs found in this room
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};
