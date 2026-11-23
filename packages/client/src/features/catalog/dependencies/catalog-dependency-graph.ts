import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogType,
} from "@semoss/shared";
import type {
	CatalogDependent,
	ItemDependencies,
} from "@/api/catalog-dependencies";
import {
	rankSearchMatches,
	type SearchEntry,
} from "@/features/dependency-map/dependency-graph";
import { getResourcePagePath } from "@/utility/catalog";
import {
	canUseDependency,
	type DependencyAccess,
	getDependencyAccess,
	getDependencyDisplayName,
	getDependencyTypeConfig,
	isPrivateDependency,
} from "./catalog-dependency";

/**
 * Where a node sits: the owner, what it uses, what uses it, or an item
 * reached by traversing from another one (`RELATED`), such as something else
 * that uses one of the owner's dependencies.
 */
type DependencyGraphSide = "ROOT" | "USES" | "USED_BY" | "RELATED";

/**
 * A way to traverse from an item: upstream to what it uses, or downstream to
 * what uses it. The canvas, the menu and the graph all use these words.
 */
export type TraverseDirection = "UPSTREAM" | "DOWNSTREAM";

/** One traversal shown on the canvas: an item and a direction, as a key. */
export type TraversalKey = `${string}|${TraverseDirection}`;

/**
 * The key of a traversal.
 *
 * @param id - The item traversed from.
 * @param direction - Which way.
 * @returns Its key.
 */
export const getTraversalKey = (
	id: string,
	direction: TraverseDirection,
): TraversalKey => `${id}|${direction}`;

/**
 * Where a traversal from a placed item stands: shown (it can be hidden),
 * more to show (or not read yet), or nothing that way.
 */
type TraverseState = "SHOWN" | "MORE" | "NONE";

/** The id of the node that stands for the dependents the user cannot view. */
export const PRIVATE_DEPENDENTS_ID = "private-dependents";

/** What the node standing for the dependents the user cannot view is called under its name. */
export const PRIVATE_DEPENDENTS_LABEL = "Items you can't view";

/** The role of the link from the dependents the user cannot view to the owner. */
export const HIDDEN_ROLE = "HIDDEN";

/** One engine or project in an owner's dependency graph. */
export interface CatalogGraphNode {
	/** Its id; {@link PRIVATE_DEPENDENTS_ID} for the private dependents */
	readonly id: string;
	/** Engine or project */
	readonly kind: "ENGINE" | "PROJECT";
	/** Its specific type */
	readonly type: string;
	/** An engine's subtype; null when unknown or private */
	readonly subtype: string | null;
	/** The name to show: "Private <Type>" when it is private to the user */
	readonly name: string;
	/** Its catalog description; null when it has none or is private */
	readonly description: string | null;
	/** Which side of the owner it is on */
	readonly side: DependencyGraphSide;
	/** How many links from the owner, on its side; 0 for the owner */
	readonly depth: number;
	/** The node as the backend sent it; only the owner's dependencies have one */
	readonly dependency: CatalogDependency | null;
	/**
	 * The user's access, for the owner's dependencies; null where the backend
	 * does not say (the owner and what uses it)
	 */
	readonly access: DependencyAccess | null;
	/** Whether the user cannot see what it is */
	readonly isPrivate: boolean;
	/** How many items it stands for; set only on the private dependents */
	readonly hiddenCount?: number;
}

/** One link: `source` depends on `target`, in one role. */
interface CatalogGraphEdge {
	/** Unique per source, target and role */
	readonly id: string;
	/** The item that has the dependency */
	readonly source: string;
	/** The item it depends on */
	readonly target: string;
	/** Why the source depends on the target */
	readonly role: string;
	/** Whether the backend recorded it from the source's configuration */
	readonly isAutomatic: boolean;
	/** The link's name; manual links only */
	readonly name: string | null;
	/** What the link is for */
	readonly description: string | null;
}

/** An owner's dependency graph, both ways, before it is filtered or placed. */
export interface CatalogDependencyGraph {
	/** The owner's id */
	readonly rootId: string;
	/** Every node, the owner included, by id */
	readonly nodes: ReadonlyMap<string, CatalogGraphNode>;
	/** Every link */
	readonly edges: readonly CatalogGraphEdge[];
	/** The items whose every dependency has been read, so upstream is known */
	readonly knownUpstream: ReadonlySet<string>;
	/** The items whose every dependent has been read, so downstream is known */
	readonly knownDownstream: ReadonlySet<string>;
}

/** The owner the graph is built around. */
interface DependencyGraphRoot {
	/** Its id */
	readonly id: string;
	/** Its specific type */
	readonly type: CatalogType;
	/** Its name */
	readonly name: string;
	/** An engine's subtype */
	readonly subtype?: string | null;
	/** Its description */
	readonly description?: string | null;
}

/** What {@link buildCatalogDependencyGraph} reads. */
export interface BuildCatalogDependencyGraphInput {
	/** The owner */
	readonly root: DependencyGraphRoot;
	/** Every node `GetCatalogDependencies` returned */
	readonly nodes: readonly CatalogDependency[];
	/** Every link `GetCatalogDependencies` returned */
	readonly links: readonly CatalogDependencyLink[];
	/** Every link `GetCatalogDependents` returned, all the way up */
	readonly dependents: readonly CatalogDependent[];
	/** How many dependents the user cannot view */
	readonly hiddenCount: number;
	/**
	 * What uses an item traversed downstream, by its id, from
	 * `GetCatalogDependents` without `recursive`
	 */
	readonly extraDependents?: ReadonlyMap<string, readonly CatalogDependent[]>;
	/** What an item traversed upstream uses, by its id, all the way down */
	readonly extraDependencies?: ReadonlyMap<string, ItemDependencies>;
}

const NO_EXTRA = new Map<never, never>();

const edgeId = (source: string, target: string, role: string): string =>
	`${source}->${target}:${role}`;

/**
 * Groups items by a key, each group in the items' order.
 *
 * @param items - The items.
 * @param keyOf - Each item's key.
 * @returns The groups, by key.
 */
const groupBy = <T, K>(
	items: Iterable<T>,
	keyOf: (item: T) => K,
): Map<K, T[]> => {
	const groups = new Map<K, T[]>();
	for (const item of items) {
		const key = keyOf(item);
		const group = groups.get(key);
		if (group) {
			group.push(item);
		} else {
			groups.set(key, [item]);
		}
	}
	return groups;
};

/** A node for an item a dependency read sent, with the user's access to it. */
const toDependencyNode = (
	node: CatalogDependency,
	side: DependencyGraphSide,
	depth: number,
): CatalogGraphNode => {
	const isPrivate = isPrivateDependency(node);
	return {
		id: node.catalog_id,
		kind: getDependencyTypeConfig(node.catalog_type).kind,
		type: node.catalog_type,
		subtype: isPrivate ? null : (node.catalog_subtype ?? null),
		name: getDependencyDisplayName(node),
		description: isPrivate ? null : node.description || null,
		side,
		depth,
		dependency: node,
		access: getDependencyAccess(node),
		isPrivate,
	};
};

/** A node for an item a dependents read sent, which says nothing of access. */
const toDependentNode = (
	dependent: CatalogDependent,
	side: DependencyGraphSide,
	depth: number,
): CatalogGraphNode => ({
	id: dependent.catalog_id,
	kind: getDependencyTypeConfig(dependent.catalog_type).kind,
	type: dependent.catalog_type,
	subtype: dependent.catalog_subtype ?? null,
	name: dependent.catalog_name || dependent.catalog_id,
	description: null,
	side,
	depth,
	dependency: null,
	access: null,
	isPrivate: false,
});

/** The edge for a dependency read's link from `parentId`. */
const toLinkEdge = (
	parentId: string,
	link: CatalogDependencyLink,
): CatalogGraphEdge => ({
	id: edgeId(parentId, link.catalog_id, link.role),
	source: parentId,
	target: link.catalog_id,
	role: link.role,
	isAutomatic: link.is_automatic,
	name: link.dependency_name,
	description: link.dependency_description,
});

/** The edge for a dependents read's link, from the dependent to `target`. */
const toDependentEdge = (
	dependent: CatalogDependent,
	target: string,
): CatalogGraphEdge => ({
	id: edgeId(dependent.catalog_id, target, dependent.role),
	source: dependent.catalog_id,
	target,
	role: dependent.role,
	isAutomatic: dependent.is_automatic,
	name: dependent.dependency_name,
	description: dependent.dependency_description,
});

/**
 * Builds an owner's graph from what it uses and what uses it. Each item is
 * placed once, on the side and at the depth it is first reached by a
 * breadth-first walk from the owner, so cycles end. What it uses comes with
 * the user's access; a dependency private to the user is named by its type.
 * The dependents the user cannot view are one node standing for all of them,
 * next to the owner, and a dependent linked only through one of them is linked
 * to that node instead.
 *
 * @param input - The owner and what the two reads returned.
 * @returns The graph.
 */
export const buildCatalogDependencyGraph = ({
	root,
	nodes,
	links,
	dependents,
	hiddenCount,
	extraDependents = NO_EXTRA,
	extraDependencies = NO_EXTRA,
}: BuildCatalogDependencyGraphInput): CatalogDependencyGraph => {
	const graphNodes = new Map<string, CatalogGraphNode>();
	const edges: CatalogGraphEdge[] = [];
	const edgeIds = new Set<string>();
	const addEdge = (edge: CatalogGraphEdge): void => {
		if (!edgeIds.has(edge.id)) {
			edgeIds.add(edge.id);
			edges.push(edge);
		}
	};

	graphNodes.set(root.id, {
		id: root.id,
		kind: getDependencyTypeConfig(root.type).kind,
		type: root.type,
		subtype: root.subtype ?? null,
		name: root.name || root.id,
		description: root.description ?? null,
		side: "ROOT",
		depth: 0,
		dependency: null,
		access: null,
		isPrivate: false,
	});

	/**
	 * Walks down from an item over a read's links, adding each item first
	 * reached on the given side, one link deeper than the one it was reached
	 * from, and every link. A link back to an item already placed, such as
	 * the owner in a cycle, is kept; one to an item the read did not send is
	 * not. Each item walked from is marked in `walked`, when given.
	 */
	const walkDown = (
		startId: string,
		read: {
			nodes: readonly CatalogDependency[];
			links: readonly CatalogDependencyLink[];
		},
		side: DependencyGraphSide,
		walked?: Set<string>,
	): void => {
		const byId = new Map(read.nodes.map((node) => [node.catalog_id, node]));
		const linksByParent = groupBy(read.links, (link) => link.parent_id);
		const queue = [startId];
		const reached = new Set([startId]);
		while (queue.length > 0) {
			const parentId = queue.shift() ?? "";
			walked?.add(parentId);
			const parentDepth = graphNodes.get(parentId)?.depth ?? 0;
			for (const link of linksByParent.get(parentId) ?? []) {
				const node = byId.get(link.catalog_id);
				if (!node && !graphNodes.has(link.catalog_id)) {
					continue;
				}
				if (node && !graphNodes.has(node.catalog_id)) {
					graphNodes.set(
						node.catalog_id,
						toDependencyNode(node, side, parentDepth + 1),
					);
				}
				addEdge(toLinkEdge(parentId, link));
				if (!reached.has(link.catalog_id)) {
					reached.add(link.catalog_id);
					queue.push(link.catalog_id);
				}
			}
		}
	};

	// what the owner uses, all the way down
	walkDown(root.id, { nodes, links }, "USES");

	// what uses the owner, all the way up
	const dependentsOf = groupBy(
		dependents,
		(dependent) => dependent.dependency_id,
	);
	const addDependent = (
		dependent: CatalogDependent,
		depth: number,
	): boolean => {
		if (graphNodes.has(dependent.catalog_id)) {
			return false;
		}
		graphNodes.set(
			dependent.catalog_id,
			toDependentNode(dependent, "USED_BY", depth),
		);
		return true;
	};
	const addDependentEdge = (dependent: CatalogDependent, target: string) =>
		addEdge(toDependentEdge(dependent, target));
	const walkUp = (startIds: string[]): void => {
		const queue = [...startIds];
		while (queue.length > 0) {
			const id = queue.shift() ?? "";
			const depth = graphNodes.get(id)?.depth ?? 0;
			for (const dependent of dependentsOf.get(id) ?? []) {
				if (addDependent(dependent, depth + 1)) {
					queue.push(dependent.catalog_id);
				}
				if (graphNodes.has(dependent.catalog_id)) {
					addDependentEdge(dependent, id);
				}
			}
		}
	};
	walkUp([root.id]);

	// dependents reached only through one the user cannot view
	const listed = new Set(dependents.map((d) => d.catalog_id));
	const orphans = dependents.filter(
		(d) =>
			!graphNodes.has(d.catalog_id) &&
			!graphNodes.has(d.dependency_id) &&
			!listed.has(d.dependency_id),
	);
	if (hiddenCount > 0 || orphans.length > 0) {
		const count = Math.max(hiddenCount, 1);
		graphNodes.set(PRIVATE_DEPENDENTS_ID, {
			id: PRIVATE_DEPENDENTS_ID,
			kind: "PROJECT",
			type: "PROJECT",
			subtype: null,
			name: count === 1 ? "1 hidden item" : `${count} hidden items`,
			description: null,
			side: "USED_BY",
			depth: 1,
			dependency: null,
			access: null,
			isPrivate: true,
			hiddenCount: count,
		});
		addEdge({
			id: edgeId(PRIVATE_DEPENDENTS_ID, root.id, HIDDEN_ROLE),
			source: PRIVATE_DEPENDENTS_ID,
			target: root.id,
			role: HIDDEN_ROLE,
			isAutomatic: true,
			name: null,
			description: null,
		});
		const starts: string[] = [];
		for (const orphan of orphans) {
			if (addDependent(orphan, 2)) {
				starts.push(orphan.catalog_id);
			}
			addDependentEdge(orphan, PRIVATE_DEPENDENTS_ID);
		}
		walkUp(starts);
	}

	// the owner's reads cover what its dependencies use and what uses its
	// dependents, all the way, so those directions are known
	const knownUpstream = new Set<string>([root.id]);
	const knownDownstream = new Set<string>([root.id]);
	for (const node of graphNodes.values()) {
		if (node.side === "USES") {
			knownUpstream.add(node.id);
		} else if (node.side === "USED_BY") {
			knownDownstream.add(node.id);
		}
	}

	// an item traversed upstream: everything below it, all the way down
	for (const [itemId, read] of extraDependencies) {
		if (graphNodes.has(itemId)) {
			walkDown(itemId, read, "RELATED", knownUpstream);
		}
	}

	// an item traversed downstream: what uses it directly
	for (const [itemId, itemDependents] of extraDependents) {
		const item = graphNodes.get(itemId);
		if (!item) {
			continue;
		}
		knownDownstream.add(itemId);
		for (const dependent of itemDependents) {
			if (!graphNodes.has(dependent.catalog_id)) {
				graphNodes.set(
					dependent.catalog_id,
					toDependentNode(dependent, "RELATED", item.depth + 1),
				);
			}
			addDependentEdge(dependent, itemId);
		}
	}

	return {
		rootId: root.id,
		nodes: graphNodes,
		edges,
		knownUpstream,
		knownDownstream,
	};
};

/** A node placed on the canvas, with what the view left out beyond it. */
interface PlacedGraphNode extends CatalogGraphNode {
	/** Left edge, in canvas units */
	readonly x: number;
	/** Top edge, in canvas units */
	readonly y: number;
	/** Whether it can be traversed upstream, to what it uses, or hidden */
	readonly upstream: TraverseState;
	/** Whether it can be traversed downstream, to what uses it, or hidden */
	readonly downstream: TraverseState;
}

/** What the canvas draws. */
export interface DependencyGraphView {
	/** The nodes shown, placed */
	readonly nodes: readonly PlacedGraphNode[];
	/** The links between them */
	readonly edges: readonly CatalogGraphEdge[];
}

/** How the graph is filtered. */
export interface DependencyGraphViewOptions {
	/**
	 * The traversals shown past the owner's direct links, each an item and a
	 * direction
	 */
	readonly traversals: ReadonlySet<TraversalKey>;
}

/** The size of a node on the tab's canvas: the automation canvas's card width. */
export const GRAPH_NODE_SIZE = { width: 280, height: 72 } as const;
const COLUMN_GAP = 96;
const ROW_GAP = 24;

/** The links out of and into each node, for walking the graph either way. */
const indexEdges = (
	edges: readonly CatalogGraphEdge[],
): {
	usesOf: ReadonlyMap<string, CatalogGraphEdge[]>;
	usedByOf: ReadonlyMap<string, CatalogGraphEdge[]>;
} => {
	return {
		usesOf: groupBy(edges, (edge) => edge.source),
		usedByOf: groupBy(edges, (edge) => edge.target),
	};
};

/**
 * Filters the graph to the owner's direct links both ways, plus each
 * traversal shown, and lays it out left to right: what uses an item to its
 * left and what it uses to its right, one column per link, the owner in the
 * middle. An item is placed once, where it is first reached walking out from
 * the owner, so a traversal that meets an item already shown only adds the
 * line to it. Each column is ordered by where its neighbours one column in
 * sit, then by type and name, so the same graph always draws the same way.
 *
 * @param graph - The graph.
 * @param options - The traversals shown.
 * @returns The nodes to draw, placed, each with where its traversals stand,
 *   and their links.
 */
export const getDependencyGraphView = (
	graph: CatalogDependencyGraph,
	{ traversals }: DependencyGraphViewOptions,
): DependencyGraphView => {
	const { usesOf, usedByOf } = indexEdges(graph.edges);
	const isShown = (id: string, direction: TraverseDirection): boolean =>
		id === graph.rootId || traversals.has(getTraversalKey(id, direction));

	// walk out from the owner over the links shown
	const columnOf = new Map<string, number>([[graph.rootId, 0]]);
	const queue = [graph.rootId];
	while (queue.length > 0) {
		const id = queue.shift() ?? "";
		const column = columnOf.get(id) ?? 0;
		if (isShown(id, "UPSTREAM")) {
			for (const edge of usesOf.get(id) ?? []) {
				if (
					!columnOf.has(edge.target) &&
					graph.nodes.has(edge.target)
				) {
					columnOf.set(edge.target, column + 1);
					queue.push(edge.target);
				}
			}
		}
		if (isShown(id, "DOWNSTREAM")) {
			for (const edge of usedByOf.get(id) ?? []) {
				if (
					!columnOf.has(edge.source) &&
					graph.nodes.has(edge.source)
				) {
					columnOf.set(edge.source, column - 1);
					queue.push(edge.source);
				}
			}
		}
	}

	/** Where a traversal from a shown item stands. */
	const getTraverseState = (
		node: CatalogGraphNode,
		direction: TraverseDirection,
	): TraverseState => {
		// the owner shows both ways; a private item is never traversed, but
		// the hidden items node lists what reached the owner through it
		if (
			node.id === graph.rootId ||
			(node.isPrivate && node.hiddenCount === undefined)
		) {
			return "NONE";
		}
		const isKnown = (
			direction === "UPSTREAM"
				? graph.knownUpstream
				: graph.knownDownstream
		).has(node.id);
		const others = (
			direction === "UPSTREAM"
				? usesOf.get(node.id)
				: usedByOf.get(node.id)
		)?.map((edge) =>
			direction === "UPSTREAM" ? edge.target : edge.source,
		);
		const hasAny = (others ?? []).length > 0;
		if (traversals.has(getTraversalKey(node.id, direction))) {
			return hasAny ? "SHOWN" : "NONE";
		}
		if (!isKnown) {
			return "MORE";
		}
		return (others ?? []).some((other) => !columnOf.has(other))
			? "MORE"
			: "NONE";
	};

	const columns = groupBy(
		[...columnOf].flatMap(([id, column]) => {
			const node = graph.nodes.get(id);
			return node ? [{ node, column }] : [];
		}),
		({ column }) => column,
	);
	// a node's neighbours one column nearer the owner, for its row
	const innerNeighbours = (id: string, column: number): string[] => {
		const inner = column - Math.sign(column);
		return [
			...(usesOf.get(id) ?? []).map((edge) => edge.target),
			...(usedByOf.get(id) ?? []).map((edge) => edge.source),
		].filter((other) => columnOf.get(other) === inner);
	};
	const rowOf = new Map<string, number>([[graph.rootId, 0]]);
	const columnKeys = [...columns.keys()].sort(
		(a, b) => Math.abs(a) - Math.abs(b) || a - b,
	);
	const placed: PlacedGraphNode[] = [];
	for (const column of columnKeys) {
		const inColumn = (columns.get(column) ?? []).map(({ node }) => node);
		const barycenter = (node: CatalogGraphNode): number => {
			const rows = innerNeighbours(node.id, column).flatMap((inner) => {
				const row = rowOf.get(inner);
				return row === undefined ? [] : [row];
			});
			return rows.length === 0
				? 0
				: rows.reduce((sum, row) => sum + row, 0) / rows.length;
		};
		const sorted = [...inColumn].sort(
			(a, b) =>
				barycenter(a) - barycenter(b) ||
				a.type.localeCompare(b.type) ||
				a.name.localeCompare(b.name) ||
				a.id.localeCompare(b.id),
		);
		sorted.forEach((node, index) => {
			const row = index - (sorted.length - 1) / 2;
			rowOf.set(node.id, row);
			placed.push({
				...node,
				x: column * (GRAPH_NODE_SIZE.width + COLUMN_GAP),
				y: row * (GRAPH_NODE_SIZE.height + ROW_GAP),
				upstream: getTraverseState(node, "UPSTREAM"),
				downstream: getTraverseState(node, "DOWNSTREAM"),
			});
		});
	}

	return {
		nodes: placed,
		edges: graph.edges.filter(
			(edge) => columnOf.has(edge.source) && columnOf.has(edge.target),
		),
	};
};

/** One link of a node, with the item at its other end. */
export interface GraphNodeLink {
	/** The link */
	readonly edge: CatalogGraphEdge;
	/** The item at the link's other end */
	readonly other: CatalogGraphNode;
	/** The type of the item that has the dependency, whose configuration sets an automatic link */
	readonly sourceType: string;
}

/**
 * The links into and out of one node, each with the item at its other end.
 *
 * @param graph - The graph.
 * @param id - The node.
 * @returns What it uses and what uses it, one link per role.
 */
export const getNodeLinks = (
	graph: CatalogDependencyGraph,
	id: string,
): { uses: GraphNodeLink[]; usedBy: GraphNodeLink[] } => {
	const toLinks = (end: "source" | "target"): GraphNodeLink[] =>
		graph.edges.flatMap((edge) => {
			// the other end of a link out is its target, of a link in its source
			const other = graph.nodes.get(
				end === "source" ? edge.target : edge.source,
			);
			const source = graph.nodes.get(edge.source);
			return edge[end] === id && other && source
				? [{ edge, other, sourceType: source.type }]
				: [];
		});
	return { uses: toLinks("source"), usedBy: toLinks("target") };
};

/**
 * The area the nodes of a view cover, in canvas units, for fitting the canvas
 * to it without waiting for React Flow to measure them.
 *
 * @param view - The placed view.
 * @returns Its bounds; zero-sized when it has no nodes.
 */
export const getGraphBounds = (
	view: DependencyGraphView,
): { x: number; y: number; width: number; height: number } => {
	if (view.nodes.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const node of view.nodes) {
		minX = Math.min(minX, node.x);
		minY = Math.min(minY, node.y);
		maxX = Math.max(maxX, node.x + GRAPH_NODE_SIZE.width);
		maxY = Math.max(maxY, node.y + GRAPH_NODE_SIZE.height);
	}
	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

/** Where an item of the graph can be opened, when the user may open it. */
interface GraphNodePaths {
	/**
	 * Its catalog page; null for the owner, a private item, the private
	 * dependents or a type with no page
	 */
	readonly catalogPath: string | null;
	/** Its own Ontology tab, to keep walking from it; null where it cannot be followed */
	readonly ontologyPath: string | null;
}

/**
 * Where a node can be opened. Only an item the user can see has a catalog
 * page, and only one they can view in full (it uses the owner, or they can use
 * it) has an Ontology tab they can open.
 *
 * @param graph - The graph.
 * @param node - The node.
 * @returns Its paths, each null when it does not apply.
 */
export const getGraphNodePaths = (
	graph: CatalogDependencyGraph,
	node: CatalogGraphNode,
): GraphNodePaths => {
	const canOpen =
		!node.isPrivate &&
		node.hiddenCount === undefined &&
		node.id !== graph.rootId;
	if (!canOpen) {
		return { catalogPath: null, ontologyPath: null };
	}
	const catalogPath = getResourcePagePath(node.kind, node.type, node.id);
	if (!catalogPath) {
		return { catalogPath: null, ontologyPath: null };
	}
	const canFollow =
		node.side === "USED_BY" ||
		(node.access ? canUseDependency(node.access) : false);
	return {
		catalogPath,
		ontologyPath: canFollow ? `${catalogPath}/ontology` : null,
	};
};

/**
 * The traversals to show so an item further out than the owner's direct
 * links shows: each item between it and the owner, with the way to go from
 * it, nearest the owner first, along the shortest walk over the links read.
 *
 * @param graph - The graph.
 * @param id - The item to show.
 * @returns The traversals; empty for the owner, a direct link, or an item
 *   the graph cannot reach.
 */
export const getPathToNode = (
	graph: CatalogDependencyGraph,
	id: string,
): TraversalKey[] => {
	const { usesOf, usedByOf } = indexEdges(graph.edges);
	const cameFrom = new Map<
		string,
		{ from: string; key: TraversalKey } | null
	>([[graph.rootId, null]]);
	const queue = [graph.rootId];
	while (queue.length > 0 && !cameFrom.has(id)) {
		const current = queue.shift() ?? "";
		const steps: [string, TraverseDirection][] = [
			...(usesOf.get(current) ?? []).map(
				(edge): [string, TraverseDirection] => [
					edge.target,
					"UPSTREAM",
				],
			),
			...(usedByOf.get(current) ?? []).map(
				(edge): [string, TraverseDirection] => [
					edge.source,
					"DOWNSTREAM",
				],
			),
		];
		for (const [next, direction] of steps) {
			if (!cameFrom.has(next) && graph.nodes.has(next)) {
				cameFrom.set(next, {
					from: current,
					key: getTraversalKey(current, direction),
				});
				queue.push(next);
			}
		}
	}
	const path: TraversalKey[] = [];
	let step = cameFrom.get(id);
	while (step) {
		// the owner shows both ways already
		if (step.from !== graph.rootId) {
			path.unshift(step.key);
		}
		step = cameFrom.get(step.from);
	}
	return path;
};

/**
 * Searches the graph by name, and by id for the items the user can see, best
 * first: an exact name, then a name that starts with the search, then one
 * that holds it, then an id. The owner and the private dependents node are
 * left out.
 *
 * @param graph - The graph.
 * @param query - The search.
 * @returns The matching ids; empty for an empty search.
 */
export const searchCatalogGraph = (
	graph: CatalogDependencyGraph,
	query: string,
): string[] => {
	if (!query.trim()) {
		return [];
	}
	const entries: SearchEntry[] = [];
	for (const node of graph.nodes.values()) {
		if (node.id === graph.rootId || node.hiddenCount !== undefined) {
			continue;
		}
		entries.push({
			id: node.id,
			name: node.name.toLowerCase(),
			// a private item matches only by the name the user sees
			lowerId: node.isPrivate ? null : node.id.toLowerCase(),
		});
	}
	return rankSearchMatches(entries, query);
};
