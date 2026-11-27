import { useCallback, useEffect, useRef, useState } from "react";
import {
	type KnowledgeEngine,
	type ListKnowledgeEnginesOptions,
	listKnowledgeEngines,
} from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";

/** Where a read of the knowledge pages stands. */
export type KnowledgeReadStatus = "LOADING" | "READY" | "ERROR";

/** What {@link useKnowledgeSources} returns. */
export interface KnowledgeSourcesState {
	/** The sources last read. */
	sources: readonly KnowledgeEngine[];
	/** Where the read stands. A refresh keeps it `READY`. */
	status: KnowledgeReadStatus;
	/** Reads the sources again, as at first, showing the loading state. */
	retry: () => void;
	/**
	 * Reads the sources with these tags in place of the list, keeping the list
	 * on screen meanwhile and when the read fails.
	 */
	refresh: (tags: readonly string[]) => void;
}

/**
 * A source's tags, however the server sends them.
 *
 * @param tag - The engine's tag metadata: one tag, several, or none.
 * @returns The tags, as a list.
 */
export const readTags = (tag: KnowledgeEngine["tag"]): string[] => {
	if (!tag) return [];
	return Array.isArray(tag) ? tag : [tag];
};

/**
 * Reads the user's knowledge sources in the session's insight: every source,
 * or the one source named.
 *
 * @param engineId - Read only this source.
 * @returns The sources, where the read stands, and how to read them again.
 */
export const useKnowledgeSources = (
	engineId?: string,
): KnowledgeSourcesState => {
	const { withInsight } = useSessionInsight();
	const [sources, setSources] = useState<readonly KnowledgeEngine[]>([]);
	const [status, setStatus] = useState<KnowledgeReadStatus>("LOADING");
	// counts reads, so one that a newer read or an unmount replaced is dropped
	const requestRef = useRef(0);

	const load = useCallback(
		(options: ListKnowledgeEnginesOptions, isRefresh: boolean) => {
			const request = ++requestRef.current;
			if (!isRefresh) setStatus("LOADING");
			withInsight((insightId) => listKnowledgeEngines(insightId, options))
				.then((next) => {
					if (request !== requestRef.current) return;
					setSources(next);
					setStatus("READY");
				})
				.catch((error: unknown) => {
					if (request !== requestRef.current) return;
					console.error("Error retrieving knowledge sources", error);
					if (!isRefresh) setStatus("ERROR");
				});
		},
		[withInsight],
	);

	useEffect(() => {
		load({ engineId: engineId }, false);
		return () => {
			requestRef.current++;
		};
	}, [load, engineId]);

	return {
		sources,
		status,
		retry: () => load({ engineId: engineId }, false),
		refresh: (tags) => load({ tags: tags }, true),
	};
};
