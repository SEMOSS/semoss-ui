import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { toError } from "@semoss/utility";
import type { Agent } from "@/types/agent";
import { agentFromProjectRow } from "../utils/agent-from-workspace";
import { listAgents } from "./list-agents";

/** Loads the agent list locally and refetches when its subscribed version changes. */
export function useAgents(version = 0) {
	const { actions } = useInsight();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		void version;

		listAgents(actions)
			.then((rows) => {
				if (cancelled) return;
				setAgents(rows.map(agentFromProjectRow));
				setError(null);
			})
			.catch((cause: unknown) => {
				if (!cancelled) setError(toError(cause));
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [actions, version]);

	return { agents, isLoading, error };
}
