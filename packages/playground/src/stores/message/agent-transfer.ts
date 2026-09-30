import type { AgentRunSummary } from "@semoss/sdk";

/** Returns every durable transfer run that is not represented in room history. */
export const getMissingTransferredRuns = (
	runs: AgentRunSummary[],
	observedRunIds: Set<string>,
): AgentRunSummary[] =>
	runs.filter(
		(run) =>
			Boolean(run.transferFromRunId) && !observedRunIds.has(run.runId),
	);
