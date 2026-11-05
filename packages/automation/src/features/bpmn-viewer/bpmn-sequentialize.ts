import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";

/** Outcome of {@link sequentializeFanOut}. */
export interface SequentializeResult {
	steps: AutomationNode[];
	edges: AutomationEdge[];
}

/**
 * Makes an imported BPMN graph runnable by Automation, which runs steps in
 * sequence and only lets a decision node branch.
 *
 * Any other node with several outgoing flows (a parallel gateway split, or a
 * task drawn with two exits) is a parallel split. Its branches are run one
 * after another, in the order they appear in the file, and rejoin where they
 * did before. Parallel gateways carry no logic of their own, so they are then
 * removed and their neighbours connected directly.
 *
 * @param steps - Imported nodes.
 * @param edges - Imported control edges, in file order.
 * @param gatewayIds - Ids of nodes that are plain parallel gateways, removed
 *   once the graph is sequential.
 * @param warnings - Receives a note for each split reordered or not resolved.
 */
export function sequentializeFanOut(
	steps: readonly AutomationNode[],
	edges: readonly AutomationEdge[],
	gatewayIds: ReadonlySet<string>,
	warnings: string[],
): SequentializeResult {
	let current = [...edges];
	const labelOf = (id: string) =>
		steps.find((step) => step.id === id)?.label ?? id;
	const isDecision = (step: AutomationNode) => step.type === "branch";
	const outgoing = (id: string) =>
		current.filter((edge) => edge.source === id);

	/** Nodes reachable from `start`, in breadth-first order, `start` included. */
	const reachFrom = (start: string): string[] => {
		const seen = new Set([start]);
		const order = [start];
		for (let index = 0; index < order.length; index++) {
			for (const edge of outgoing(order[index])) {
				if (seen.has(edge.target)) continue;
				seen.add(edge.target);
				order.push(edge.target);
			}
		}
		return order;
	};

	/** Keeps only the first outgoing flow; the others cannot be ordered. */
	const dropExtraFlows = (splitId: string) => {
		const [, ...extra] = outgoing(splitId);
		const extraIds = new Set(extra.map((edge) => edge.id));
		current = current.filter((edge) => !extraIds.has(edge.id));
		warnings.push(
			`Parallel paths from "${labelOf(splitId)}" could not be put in order; only the first path was kept.`,
		);
	};

	const sequentializeSplit = (splitId: string) => {
		const splitEdges = outgoing(splitId);
		const targets = splitEdges.map((edge) => edge.target);
		const reaches = targets.map((target) => reachFrom(target));
		const reachSets = reaches.map((order) => new Set(order));

		// The join is the first node every branch reaches.
		const join =
			reaches[0].find((id) => reachSets.every((set) => set.has(id))) ??
			null;
		const afterJoin = new Set(join ? reachFrom(join) : []);
		const regions = reaches.map(
			(order) => new Set(order.filter((id) => !afterJoin.has(id))),
		);

		const claimed = new Set<string>();
		for (const region of regions) {
			for (const id of region) {
				if (claimed.has(id)) {
					dropExtraFlows(splitId);
					return;
				}
				claimed.add(id);
			}
		}

		const branchIndexes = regions
			.map((region, index) => (region.size > 0 ? index : -1))
			.filter((index) => index >= 0);
		const exitsOf = (index: number): string[] =>
			[...regions[index]].filter((id) =>
				join
					? current.some(
							(edge) =>
								edge.source === id && edge.target === join,
						)
					: outgoing(id).length === 0,
			);
		if (branchIndexes.some((index) => exitsOf(index).length === 0)) {
			dropExtraFlows(splitId);
			return;
		}

		// Only the first branch stays attached to the split.
		const keepEdgeId = splitEdges[branchIndexes[0] ?? 0].id;
		const added: AutomationEdge[] = [];
		const removedIds = new Set(
			splitEdges
				.filter((edge) => edge.id !== keepEdgeId)
				.map((edge) => edge.id),
		);

		for (let slot = 0; slot < branchIndexes.length - 1; slot++) {
			const nextEntry = targets[branchIndexes[slot + 1]];
			for (const exitId of exitsOf(branchIndexes[slot])) {
				const toJoin = join
					? current.find(
							(edge) =>
								edge.source === exitId && edge.target === join,
						)
					: undefined;
				if (toJoin) {
					removedIds.add(toJoin.id);
					added.push({
						...toJoin,
						target: nextEntry,
						targetHandle: `in-${nextEntry}`,
					});
				} else {
					const exitNode = steps.find((step) => step.id === exitId);
					if (!exitNode || isDecision(exitNode)) continue;
					added.push({
						id: `bpmn-sequence-${exitId}-${nextEntry}`,
						source: exitId,
						target: nextEntry,
						sourceHandle: `out-${exitId}`,
						targetHandle: `in-${nextEntry}`,
					});
				}
			}
		}

		current = [
			...current.filter((edge) => !removedIds.has(edge.id)),
			...added,
		];
		warnings.push(
			`Parallel paths from "${labelOf(splitId)}" run one after another, in the order they appear in the file.`,
		);
	};

	// Innermost splits first: one whose branches hold no other split.
	const done = new Set<string>();
	for (let pass = 0; pass <= steps.length; pass++) {
		const splits = steps.filter(
			(step) =>
				!isDecision(step) &&
				!done.has(step.id) &&
				outgoing(step.id).length > 1,
		);
		if (splits.length === 0) break;
		const splitIds = new Set(splits.map((step) => step.id));
		const next =
			splits.find((step) => {
				const reached = reachFrom(step.id).slice(1);
				return !reached.some((id) => splitIds.has(id));
			}) ?? splits[0];
		done.add(next.id);
		sequentializeSplit(next.id);
	}

	// Parallel gateways have no logic: join their neighbours and drop them.
	let remaining = [...steps];
	for (const gatewayId of gatewayIds) {
		if (!remaining.some((step) => step.id === gatewayId)) continue;
		const incoming = current.filter((edge) => edge.target === gatewayId);
		const leaving = current.filter((edge) => edge.source === gatewayId);
		const rewired: AutomationEdge[] = [];
		for (const inEdge of incoming) {
			leaving.forEach((outEdge, index) => {
				rewired.push({
					...inEdge,
					id: index === 0 ? inEdge.id : `${inEdge.id}-${index + 1}`,
					target: outEdge.target,
					targetHandle: outEdge.targetHandle,
				});
			});
		}
		current = [
			...current.filter(
				(edge) =>
					edge.source !== gatewayId && edge.target !== gatewayId,
			),
			...rewired,
		];
		remaining = remaining.filter((step) => step.id !== gatewayId);
	}

	return { steps: remaining, edges: current };
}
