import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { listAssignedDelegations } from "@/features/delegations/api/delegations";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { type AttentionScan, scanAgentAttention } from "./agent-attention";
import {
	useVisibleResource,
	type VisibleResource,
} from "./use-visible-resource";

interface AgentAttention {
	runs: AgentRun[];
	scan: AttentionScan;
	isLoading: boolean;
	delegations: VisibleResource<
		Awaited<ReturnType<typeof listAssignedDelegations>>
	>;
	refresh: () => void;
}

/** Keep discoveries during partial failures and suspend background discovery when hidden. */
export function useAgentAttention(
	enabled: boolean,
	refreshRevision = 0,
): AgentAttention {
	const { actions, insightId } = useInsight();
	const [runs, setRuns] = useState<AgentRun[]>([]);
	const pending = useRef<AgentRun[]>([]);
	const [scan, setScan] = useState<AttentionScan>({
		checked: 0,
		complete: false,
		errors: [],
	});
	const [isLoading, setIsLoading] = useState(false);
	const [revision, setRevision] = useState(0);
	const loadDelegations = useCallback(() => {
		void refreshRevision;
		return listAssignedDelegations(actions, "PENDING");
	}, [actions, refreshRevision]);
	const delegations = useVisibleResource(loadDelegations, enabled);
	useEffect(() => {
		void revision;
		void refreshRevision;
		if (!enabled) return;
		let cancelled = false;
		let busy = false;
		const read = async () => {
			if (busy || document.visibilityState === "hidden") return;
			busy = true;
			setIsLoading(true);
			setScan((current) => ({ ...current, complete: false }));
			await scanAgentAttention({
				actions,
				insightId,
				previous: pending.current,
				isCancelled: () =>
					cancelled || document.visibilityState === "hidden",
				onRun: (run) => {
					pending.current = [
						...pending.current.filter(
							(entry) => entry.runId !== run.runId,
						),
						...(run.pendingActions.length > 0 ||
						run.status === "INPUT_REQUIRED"
							? [run]
							: []),
					];
					setRuns(pending.current);
				},
				onProgress: setScan,
			});
			busy = false;
			if (!cancelled) setIsLoading(false);
		};
		void read();
		const timer = window.setInterval(() => void read(), 60_000);
		window.addEventListener("focus", read);
		document.addEventListener("visibilitychange", read);
		return () => {
			cancelled = true;
			window.clearInterval(timer);
			window.removeEventListener("focus", read);
			document.removeEventListener("visibilitychange", read);
		};
	}, [actions, insightId, enabled, revision, refreshRevision]);
	function refresh(): void {
		delegations.refresh();
		setRevision((value) => value + 1);
	}
	return { runs, scan, isLoading, delegations, refresh };
}
