import { useEffect, useState } from "react";
import { getWorkspace, type WorkspaceDetails } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";

/** What {@link useAgentWorkspace} returns. */
export interface AgentWorkspaceRead {
	/** The agent asked for, once read; null while reading, on a failure, or with no agent. */
	readonly workspace: WorkspaceDetails | null;
	/** How the read stands: `IDLE` with no agent asked for. */
	readonly status: "IDLE" | "LOADING" | "READY" | "ERROR";
	/** Why the last read failed, or null. */
	readonly error: Error | null;
	/** Reads the agent again, as a Retry does. */
	readonly refresh: () => void;
}

/** The last read that landed, and which agent and attempt it answered. */
interface AgentWorkspaceResult {
	readonly key: string;
	readonly workspace: WorkspaceDetails | null;
	readonly error: Error | null;
}

/**
 * Read an agent's configuration (`GetWorkspace`) in the session's insight. A
 * read for an agent no longer asked for is dropped, so `workspace` is always
 * the agent asked for, never the one before it.
 *
 * @param workspaceId - The agent, or empty for none.
 * @returns The agent, how its read stands, and a way to read it again.
 */
export const useAgentWorkspace = (
	workspaceId: string | null | undefined,
): AgentWorkspaceRead => {
	const { withInsight } = useSessionInsight();
	const [attempt, setAttempt] = useState(0);
	const [result, setResult] = useState<AgentWorkspaceResult | null>(null);
	const key = workspaceId ? `${workspaceId}:${attempt}` : "";

	useEffect(() => {
		if (!workspaceId) return;
		let isCurrent = true;
		const answered = `${workspaceId}:${attempt}`;
		withInsight((insightId) => getWorkspace(insightId, workspaceId)).then(
			(workspace) => {
				if (isCurrent) {
					setResult({ key: answered, workspace, error: null });
				}
			},
			(error: unknown) => {
				if (isCurrent) {
					setResult({
						key: answered,
						workspace: null,
						error:
							error instanceof Error
								? error
								: new Error(String(error)),
					});
				}
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [workspaceId, attempt, withInsight]);

	const refresh = () => setAttempt((current) => current + 1);
	if (!key) {
		return { workspace: null, status: "IDLE", error: null, refresh };
	}
	if (result?.key !== key) {
		return { workspace: null, status: "LOADING", error: null, refresh };
	}
	return {
		workspace: result.workspace,
		status: result.error ? "ERROR" : "READY",
		error: result.error,
		refresh,
	};
};
