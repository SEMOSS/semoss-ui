import { createContext, useContext } from "react";
import type { DependencyDirection } from "@/api/dependency-map";

/** What a node, an edge or the inspector can ask the map to do. */
export interface DependencyMapActions {
	/** Selects an item and shows it in the inspector */
	selectNode: (id: string) => void;
	/** Selects a link and shows it in the inspector */
	selectEdge: (id: string) => void;
	/** Centers the canvas on an item and selects it */
	jumpTo: (id: string) => void;
	/** Traces what an item uses, what uses it, or both */
	trace: (id: string, direction: DependencyDirection) => void;
}

/** The map's actions, for the nodes and edges React Flow renders. */
export const DependencyMapActionsContext =
	createContext<DependencyMapActions | null>(null);

/**
 * The map's actions.
 *
 * @returns The actions.
 * @throws When used outside the map.
 */
export const useDependencyMapActions = (): DependencyMapActions => {
	const actions = useContext(DependencyMapActionsContext);
	if (!actions) {
		throw new Error(
			"useDependencyMapActions must be used inside the Dependency Map",
		);
	}
	return actions;
};
