import { useCallback, useRef, useState } from "react";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk";
import type { NodeStatus } from "../domain/automation.types";

export interface AutomationRunNodeState {
	nodeId: string;
	label: string;
	type: string;
	status: NodeStatus;
	durationMs?: number;
	outputPreview?: string | null;
	errorMessage?: string | null;
}

/** Minimal node shape needed to seed live state before any progress events arrive. */
export interface AutomationRunnableNode {
	id: string;
	label: string;
	type: string;
}

interface AutomationNodeStreamData {
	kind?: string;
	NODE_ID?: string;
	NODE_LABEL?: string;
	STATUS?: string;
	DURATION_MS?: number;
	OUTPUT_PREVIEW?: string | null;
	ERROR_MESSAGE?: string | null;
}

interface TriggerAutomationOutput {
	STATUS: string;
	summary?: string;
	ERROR_MESSAGE?: string | null;
	FAILED_NODE_ID?: string;
}

export interface UseAutomationRunResult {
	/** True for the whole duration of the run. */
	running: boolean;
	runId: string | null;
	/** One entry per node, in execution order, updated live as each node transitions. */
	nodeStates: AutomationRunNodeState[];
	/** Per-workflow human-readable summary (AutomationConstants.RESULT_SUMMARY), set once the run finishes successfully. */
	summary: string | null;
	error: string | null;
	/** Starts a run for the given nodes (in order) and streams live per-node progress. */
	run: (projectId: string, nodes: AutomationRunnableNode[]) => Promise<void>;
}

/**
 * Drives an automation run the same way playground renders live tool-call progress: one
 * `runPixelAsync("TriggerAutomation(...)")` call executes every node in order, server-side, in a
 * single long-lived job (`AutomationRunEngine` — same ordering/dependency guarantees, node N+1
 * depends on node N's persisted output), and streams a progress event per node onto that job via
 * `PixelJobManager.addStreamOut` (mirroring `HarnessToolExecutor`'s tool-call streaming). This
 * hook polls `getPixelJobStreaming(jobId)` for those events — same primitive playground's
 * `runRoomPixelStreaming` uses for live tool-call rendering — to update `nodeStates` live, then
 * fetches the final result via `getPixelAsyncResult` only once the job's status is confirmed
 * complete.
 *
 * <p>Deliberately does NOT drive nodes with separate FE-issued `RunAutomationNode` calls: that
 * design raced (a node could start before the previous one's output was actually persisted,
 * since `getPixelAsyncResult` alone doesn't block for job completion) and fought the platform's
 * existing pattern for sequential, live-observable multi-step execution.
 */
export function useAutomationRun(): UseAutomationRunResult {
	const [running, setRunning] = useState(false);
	const [runId, setRunId] = useState<string | null>(null);
	const [nodeStates, setNodeStates] = useState<AutomationRunNodeState[]>([]);
	const [summary, setSummary] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Guards against a stale run's updates landing after a newer run has started.
	const runTokenRef = useRef(0);

	const updateNode = useCallback(
		(
			token: number,
			nodeId: string,
			patch: Partial<AutomationRunNodeState>,
		) => {
			if (token !== runTokenRef.current) return;
			setNodeStates((prev) =>
				prev.map((n) => (n.nodeId === nodeId ? { ...n, ...patch } : n)),
			);
		},
		[],
	);

	const run = useCallback(
		async (projectId: string, nodes: AutomationRunnableNode[]) => {
			const token = ++runTokenRef.current;
			setRunning(true);
			setRunId(null);
			setSummary(null);
			setError(null);
			setNodeStates(
				nodes.map((n) => ({
					nodeId: n.id,
					label: n.label,
					type: n.type,
					status: "PENDING",
				})),
			);

			try {
				const { jobId } = await runPixelAsync(
					`TriggerAutomation(project=["${projectId}"]);`,
				);

				// Best-effort: surface the runId (for a future cancel affordance) as soon as
				// it's claimed — independent of, and non-blocking for, the progress stream below.
				runPixel<[{ RUN_ID?: string }]>(
					`GetActiveAutomationRun(project=["${projectId}"]);`,
				)
					.then((res) => {
						const active = res.pixelReturn[0]?.output;
						if (active?.RUN_ID && token === runTokenRef.current) {
							setRunId(active.RUN_ID);
						}
					})
					.catch(() => {
						// Non-critical — the run itself is unaffected.
					});

				let polling = true;
				while (polling) {
					if (token !== runTokenRef.current) return;

					const streamRes = await getPixelJobStreaming(jobId);
					for (const message of streamRes.message) {
						const msg = message as unknown as {
							stream_type?: string;
							data?: AutomationNodeStreamData;
						};
						if (
							msg.stream_type !== "automation" ||
							!msg.data?.NODE_ID
						) {
							continue;
						}
						const { data } = msg;
						const nodeId = data.NODE_ID as string;

						if (data.STATUS === "RUNNING") {
							updateNode(token, nodeId, { status: "RUNNING" });
						} else if (data.STATUS) {
							updateNode(token, nodeId, {
								status: data.STATUS as NodeStatus,
								durationMs: data.DURATION_MS,
								outputPreview: data.OUTPUT_PREVIEW,
								errorMessage: data.ERROR_MESSAGE,
							});
						}
					}

					if (
						streamRes.status === "ProgressComplete" ||
						streamRes.status === "Complete"
					) {
						polling = false;
					} else if (streamRes.status === "Error") {
						throw new Error("Automation run encountered an error");
					} else {
						await new Promise((resolve) =>
							setTimeout(resolve, 500),
						);
					}
				}

				if (token !== runTokenRef.current) return;

				// Job is confirmed complete (status checked above) — safe to fetch the final result.
				const asyncResult =
					await getPixelAsyncResult<[TriggerAutomationOutput]>(jobId);
				if (asyncResult.errors.length > 0) {
					throw new Error(asyncResult.errors[0]);
				}
				const finalDetail = asyncResult.results[0]?.output as
					| TriggerAutomationOutput
					| undefined;

				if (token !== runTokenRef.current) return;
				if (finalDetail?.STATUS === "FAILED") {
					throw new Error(
						finalDetail.ERROR_MESSAGE ?? "Automation failed",
					);
				}
				setSummary(
					finalDetail?.summary ??
						"Automation completed successfully.",
				);
			} catch (err) {
				if (token === runTokenRef.current) {
					setError(
						err instanceof Error
							? err.message
							: "Automation failed",
					);
				}
			} finally {
				if (token === runTokenRef.current) {
					setRunning(false);
				}
			}
		},
		[updateNode],
	);

	return { running, runId, nodeStates, summary, error, run };
}
