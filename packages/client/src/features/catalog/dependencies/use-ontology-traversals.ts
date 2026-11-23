import { useCallback, useRef, useState } from "react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type CatalogDependent,
	getCatalogDependencies,
	getCatalogDependents,
	type ItemDependencies,
} from "@/api/catalog-dependencies";
import {
	type CatalogGraphNode,
	getTraversalKey,
	type TraversalKey,
	type TraverseDirection,
} from "./catalog-dependency-graph";

/** The traversals of an Ontology tab, and the reads behind them. */
interface TraversalState {
	/** The traversals shown */
	readonly traversals: ReadonlySet<TraversalKey>;
	/** What uses each item traversed downstream, read for it */
	readonly extraDependents: ReadonlyMap<string, readonly CatalogDependent[]>;
	/** What each item traversed upstream uses, read for it */
	readonly extraDependencies: ReadonlyMap<string, ItemDependencies>;
	/** The traversals whose read is running */
	readonly pendingTraversals: ReadonlySet<TraversalKey>;
}

const EMPTY_STATE: TraversalState = {
	traversals: new Set(),
	extraDependents: new Map(),
	extraDependencies: new Map(),
	pendingTraversals: new Set(),
};

/** What {@link useOntologyTraversals} returns. */
export interface UseOntologyTraversalsResult extends TraversalState {
	/**
	 * Traverses from an item one way. When that way is not read yet
	 * (`isKnown` false), it is read first; a refused read shows the backend's
	 * reason in a toast and shows nothing new.
	 */
	readonly traverse: (
		node: Pick<CatalogGraphNode, "id" | "type">,
		direction: TraverseDirection,
		isKnown: boolean,
	) => Promise<void>;
	/** Hides a traversal */
	readonly hide: (id: string, direction: TraverseDirection) => void;
	/** Shows each of the traversals, such as the way to an item searched for */
	readonly showPath: (path: readonly TraversalKey[]) => void;
	/** Hides every traversal, back to the owner's direct links */
	readonly clear: () => void;
	/** Hides every traversal and drops the reads, which may be out of date */
	readonly reset: () => void;
}

/**
 * The Ontology tab's traversals: from any item on the canvas, upstream to
 * what it uses or downstream to what uses it, in place, with the owner kept
 * in the middle. The owner's own reads cover its dependencies' upstream and
 * its dependents' downstream; the other way is read for the item when it is
 * first traversed (`GetCatalogDependents` without `recursive`, or
 * `GetCatalogDependencies`) and kept. The view is keyed by its owner, so
 * another owner starts over; a read that finishes after a reset is dropped.
 *
 * @returns The traversals, the reads, and their actions.
 */
export const useOntologyTraversals = (): UseOntologyTraversalsResult => {
	const [state, setState] = useState<TraversalState>(EMPTY_STATE);
	// each reset starts a new generation, so a read from before it is dropped
	const generation = useRef(0);

	const traverse = useCallback(
		async (
			node: Pick<CatalogGraphNode, "id" | "type">,
			direction: TraverseDirection,
			isKnown: boolean,
		): Promise<void> => {
			const key = getTraversalKey(node.id, direction);
			const started = generation.current;
			const update =
				(next: (previous: TraversalState) => TraversalState) =>
				(previous: TraversalState): TraversalState =>
					generation.current === started ? next(previous) : previous;
			const withTraversal = (
				previous: TraversalState,
			): TraversalState => {
				const pendingTraversals = new Set(previous.pendingTraversals);
				pendingTraversals.delete(key);
				return {
					...previous,
					traversals: new Set(previous.traversals).add(key),
					pendingTraversals,
				};
			};
			if (isKnown) {
				setState(update(withTraversal));
				return;
			}
			setState(
				update((previous) => ({
					...previous,
					pendingTraversals: new Set(previous.pendingTraversals).add(
						key,
					),
				})),
			);
			try {
				if (direction === "DOWNSTREAM") {
					const dependents = await getCatalogDependents(
						node.id,
						node.type,
					);
					setState(
						update((previous) =>
							withTraversal({
								...previous,
								extraDependents: new Map(
									previous.extraDependents,
								).set(node.id, dependents),
							}),
						),
					);
				} else {
					const dependencies = await getCatalogDependencies(
						node.id,
						node.type,
					);
					setState(
						update((previous) =>
							withTraversal({
								...previous,
								extraDependencies: new Map(
									previous.extraDependencies,
								).set(node.id, dependencies),
							}),
						),
					);
				}
			} catch (error: unknown) {
				if (generation.current !== started) {
					return;
				}
				setState((previous) => {
					const pendingTraversals = new Set(
						previous.pendingTraversals,
					);
					pendingTraversals.delete(key);
					return { ...previous, pendingTraversals };
				});
				toast.error(
					getErrorMessage(
						error,
						direction === "DOWNSTREAM"
							? "Couldn't read what uses it"
							: "Couldn't read what it uses",
					),
				);
			}
		},
		[],
	);

	const hide = useCallback(
		(id: string, direction: TraverseDirection): void => {
			setState((previous) => {
				const traversals = new Set(previous.traversals);
				traversals.delete(getTraversalKey(id, direction));
				return { ...previous, traversals };
			});
		},
		[],
	);

	const showPath = useCallback((path: readonly TraversalKey[]): void => {
		setState((previous) =>
			path.every((key) => previous.traversals.has(key))
				? previous
				: {
						...previous,
						traversals: new Set([...previous.traversals, ...path]),
					},
		);
	}, []);

	const clear = useCallback((): void => {
		setState((previous) =>
			previous.traversals.size === 0
				? previous
				: { ...previous, traversals: new Set() },
		);
	}, []);

	const reset = useCallback((): void => {
		generation.current += 1;
		setState(EMPTY_STATE);
	}, []);

	return { ...state, traverse, hide, showPath, clear, reset };
};
