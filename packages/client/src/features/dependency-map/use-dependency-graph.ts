import { useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	buildDependencyGraphPixel,
	type DependencyGraphScope,
	parseDependencyGraph,
	readReply,
} from "@/api/dependency-map";
import { buildGraphIndex, type DependencyGraphIndex } from "./dependency-graph";

export interface UseDependencyGraphResult {
	/** The network as last read, indexed, or null before the first read */
	index: DependencyGraphIndex | null;
	/** Whether the first read is running, with nothing to show yet */
	isLoading: boolean;
	/** Whether the network is read again while the last one is shown */
	isRefreshing: boolean;
	/** Why the network could not be read, or null */
	error: string | null;
	/** Reads the network again */
	refresh: () => void;
}

/**
 * Reads the platform's dependency network, or the network around one item,
 * with the SDK's cancellation and backend-error handling. While it is read
 * again, the network last read stays shown, so the canvas keeps its place.
 *
 * @param scope - The traced network, or null for the whole platform.
 * @returns The indexed network and a way to read it again.
 */
export const useDependencyGraph = (
	scope: DependencyGraphScope | null,
): UseDependencyGraphResult => {
	const result = usePixel<unknown>(buildDependencyGraphPixel(scope), {
		data: null,
	});
	// the SDK clears its data while it reads again
	const [lastRead, setLastRead] = useState<unknown>(null);
	if (result.status === "SUCCESS" && result.data !== lastRead) {
		setLastRead(result.data);
	}
	const shown = result.status === "SUCCESS" ? result.data : lastRead;
	const isReading =
		result.status === "INITIAL" || result.status === "LOADING";

	// parsing and indexing a large network is costly; redo it only for a new reply
	const parsed = useMemo(
		() =>
			readReply(
				shown,
				(output) => buildGraphIndex(parseDependencyGraph(output)),
				"The ontology could not be read.",
			),
		[shown],
	);

	return {
		index: parsed.value,
		isLoading: isReading && shown === null,
		isRefreshing: isReading && shown !== null,
		error: result.error?.message ?? parsed.error,
		refresh: result.refresh,
	};
};
