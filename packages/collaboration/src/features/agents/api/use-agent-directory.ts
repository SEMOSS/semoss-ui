import { useCallback, useMemo, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Agent } from "@/types/agent";
import { agentFromProjectRow } from "../utils/agent-from-workspace";
import { type ProjectRow, projectListSchema } from "./agent-schemas";
import { agentListPixel } from "./list-agents";

const agentPageSize = 12;

export interface AgentDirectoryQuery {
	agents: Agent[];
	error: Error | null;
	hasMore: boolean;
	isLoading: boolean;
	/** True while the first page for the current search or version is unresolved. */
	isRefreshing: boolean;
	next: () => void;
	reset: () => void;
}

/** Searches and incrementally loads the agent directory from `MyProjects`. */
export function useAgentDirectory(
	searchTerm: string,
	version = 0,
): AgentDirectoryQuery {
	const queryKey = `${version}:${searchTerm}`;
	const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(
		null,
	);
	const handleSuccess = useCallback(
		(_rows: ProjectRow[], isLoadingMore: boolean) => {
			if (!isLoadingMore) setResolvedQueryKey(queryKey);
		},
		[queryKey],
	);
	const query = useIteratorPixel<unknown, ProjectRow>(
		(limit, offset) =>
			agentListPixel({
				filterWord: searchTerm || undefined,
				limit: limit + 1,
				offset,
			}),
		(response) =>
			Array.isArray(response) && response.length <= agentPageSize
				? -1
				: Number.POSITIVE_INFINITY,
		(response) => {
			const parsed = projectListSchema.safeParse(response);
			if (!parsed.success) {
				throw new Error("SEMOSS returned an invalid agents response.");
			}
			return parsed.data.slice(0, agentPageSize);
		},
		{ limit: agentPageSize, onSuccess: handleSuccess },
		[searchTerm, version],
	);
	const agents = useMemo(() => {
		const seen = new Set<string>();
		return query.data
			.filter((row) => {
				if (seen.has(row.project_id)) return false;
				seen.add(row.project_id);
				return true;
			})
			.map(agentFromProjectRow);
	}, [query.data]);

	return {
		agents,
		error: query.error,
		hasMore: query.hasMore,
		isLoading: query.isLoading,
		isRefreshing: resolvedQueryKey !== queryKey,
		next: query.next,
		reset: query.reset,
	};
}
