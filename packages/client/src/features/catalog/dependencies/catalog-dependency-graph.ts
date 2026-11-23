import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRole,
	CatalogType,
} from "@semoss/shared";
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
 * One link from an item that depends on the owner, or on one of the owner's
 * dependents, as `GetCatalogDependents` returns it: `catalog_id` depends on
 * `dependency_id`, in one role.
 */
export interface CatalogDependent {
	/** What it depends on: the owner, or an item between them */
	dependency_id: string;
	/** The item that depends on it */
	catalog_id: string;
	/** The item's specific type */
	catalog_type: CatalogType;
	/** The item's name */
	catalog_name?: string;
	/** The engine's subtype; a project's type */
	catalog_subtype?: string;
	/** Whether the backend recorded the link from the item's configuration */
	is_automatic: boolean;
	/** Why the item depends on it */
	role: CatalogDependencyRole;
	/** The link's name; manual links only */
	dependency_name: string | null;
	/** What the link is for */
	dependency_description: string | null;
}

/** Where a node sits: the owner, what it uses, or what uses it. */
export type DependencyGraphSide = "ROOT" | "USES" | "USED_BY";

/** The id of the node that stands for the dependents the user cannot view. */
export const PRIVATE_DEPENDENTS_ID = "private-dependents";

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
export interface CatalogGraphEdge {
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
}

/** The owner the graph is built around. */
export interface DependencyGraphRoot {
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
}

const edgeId = (source: string, target: string, role: string): string =>
	`${source}->${target}:${role}`;

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

	// what the owner uses, all the way down
	const byId = new Map(nodes.map((node) => [node.catalog_id, node]));
	const linksByParent = new Map<string, CatalogDependencyLink[]>();
	for (const link of links) {
		const list = linksByParent.get(link.parent_id) ?? [];
		list.push(link);
		linksByParent.set(link.parent_id, list);
	}
	const usesQueue = [root.id];
	while (usesQueue.length > 0) {
		const parentId = usesQueue.shift() ?? "";
		const parentDepth = graphNodes.get(parentId)?.depth ?? 0;
		for (const link of linksByParent.get(parentId) ?? []) {
			const node = byId.get(link.catalog_id);
			// a link back to an item already placed, such as the owner in a
			// cycle, is kept; a link to an item the backend did not send is not
			if (!node && !graphNodes.has(link.catalog_id)) {
				continue;
			}
			if (node && !graphNodes.has(node.catalog_id)) {
				const isPrivate = isPrivateDependency(node);
				graphNodes.set(node.catalog_id, {
					id: node.catalog_id,
					kind: getDependencyTypeConfig(node.catalog_type).kind,
					type: node.catalog_type,
					subtype: isPrivate ? null : (node.catalog_subtype ?? null),
					name: getDependencyDisplayName(node),
					description: isPrivate ? null : node.description || null,
					side: "USES",
					depth: parentDepth + 1,
					dependency: node,
					access: getDependencyAccess(node),
					isPrivate,
				});
				usesQueue.push(node.catalog_id);
			}
			addEdge({
				id: edgeId(parentId, link.catalog_id, link.role),
				source: parentId,
				target: link.catalog_id,
				role: link.role,
				isAutomatic: link.is_automatic,
				name: link.dependency_name,
				description: link.dependency_description,
			});
		}
	}

	// what uses the owner, all the way up
	const dependentsOf = new Map<string, CatalogDependent[]>();
	for (const dependent of dependents) {
		const list = dependentsOf.get(dependent.dependency_id) ?? [];
		list.push(dependent);
		dependentsOf.set(dependent.dependency_id, list);
	}
	const addDependent = (
		dependent: CatalogDependent,
		depth: number,
	): boolean => {
		if (graphNodes.has(dependent.catalog_id)) {
			return false;
		}
		graphNodes.set(dependent.catalog_id, {
			id: dependent.catalog_id,
			kind: getDependencyTypeConfig(dependent.catalog_type).kind,
			type: dependent.catalog_type,
			subtype: dependent.catalog_subtype ?? null,
			name: dependent.catalog_name || dependent.catalog_id,
			description: null,
			side: "USED_BY",
			depth,
			dependency: null,
			access: null,
			isPrivate: false,
		});
		return true;
	};
	const addDependentEdge = (dependent: CatalogDependent, target: string) =>
		addEdge({
			id: edgeId(dependent.catalog_id, target, dependent.role),
			source: dependent.catalog_id,
			target,
			role: dependent.role,
			isAutomatic: dependent.is_automatic,
			name: dependent.dependency_name,
			description: dependent.dependency_description,
		});
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
			id: edgeId(PRIVATE_DEPENDENTS_ID, root.id, "HIDDEN"),
			source: PRIVATE_DEPENDENTS_ID,
			target: root.id,
			role: "HIDDEN",
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

	return { rootId: root.id, nodes: graphNodes, edges };
};

/** A node placed on the canvas, with what the view left out beyond it. */
export interface PlacedGraphNode extends CatalogGraphNode {
	/** Left edge, in canvas units */
	readonly x: number;
	/** Top edge, in canvas units */
	readonly y: number;
	/** How many items one link further out the view leaves out */
	readonly hiddenChildren: number;
}

/** What the canvas draws. */
export interface DependencyGraphView {
	/** The nodes shown, placed */
	readonly nodes: readonly PlacedGraphNode[];
	/** The links between them */
	readonly edges: readonly CatalogGraphEdge[];
}

/** How many links out the view shows on each side: the direct links. */
const DIRECT_DEPTH = 1;

/** How the graph is filtered. */
export interface DependencyGraphViewOptions {
	/** Nodes whose next level is shown past the direct links */
	readonly expandedIds: ReadonlySet<string>;
}

/** The size of a node on the tab's canvas: the automation canvas's card width. */
export const GRAPH_NODE_SIZE = { width: 280, height: 72 } as const;
const COLUMN_GAP = 96;
const ROW_GAP = 24;

/**
 * Whether `child` is one link further out than `parent`, on the same side.
 *
 * @param edge - A link.
 * @param nodes - The graph's nodes.
 * @returns The inner and outer ends, or null when the link goes sideways.
 */
const getOutwardPair = (
	edge: CatalogGraphEdge,
	nodes: ReadonlyMap<string, CatalogGraphNode>,
): { inner: string; outer: string } | null => {
	const source = nodes.get(edge.source);
	const target = nodes.get(edge.target);
	if (!source || !target) {
		return null;
	}
	// on the uses side a link points outward; on the used by side, inward
	if (target.side === "USES" && target.depth === source.depth + 1) {
		return { inner: source.id, outer: target.id };
	}
	if (source.side === "USED_BY" && source.depth === target.depth + 1) {
		return { inner: target.id, outer: source.id };
	}
	return null;
};

/**
 * Filters the graph to the direct links on both sides, with the levels the
 * user expanded, and lays it out left to right: what uses the owner in
 * columns to its left, the owner in the middle, what it uses to its right,
 * one column per link. Each column is ordered by where its neighbours one
 * column in sit, then by type and name, so the same graph always draws the
 * same way.
 *
 * @param graph - The graph.
 * @param options - The expanded nodes.
 * @returns The nodes to draw, placed, and their links.
 */
export const getDependencyGraphView = (
	graph: CatalogDependencyGraph,
	{ expandedIds }: DependencyGraphViewOptions,
): DependencyGraphView => {
	const innerOf = new Map<string, string[]>();
	const outerOf = new Map<string, string[]>();
	for (const edge of graph.edges) {
		const pair = getOutwardPair(edge, graph.nodes);
		if (!pair) {
			continue;
		}
		innerOf.set(pair.outer, [
			...(innerOf.get(pair.outer) ?? []),
			pair.inner,
		]);
		outerOf.set(pair.inner, [
			...(outerOf.get(pair.inner) ?? []),
			pair.outer,
		]);
	}

	const ordered = [...graph.nodes.values()].sort((a, b) => a.depth - b.depth);
	const visible = new Set<string>();
	for (const node of ordered) {
		if (
			node.depth <= DIRECT_DEPTH ||
			(innerOf.get(node.id) ?? []).some(
				(inner) => visible.has(inner) && expandedIds.has(inner),
			)
		) {
			visible.add(node.id);
		}
	}

	// one column per link from the owner: negative to its left
	const columns = new Map<number, CatalogGraphNode[]>();
	for (const node of ordered) {
		if (!visible.has(node.id)) {
			continue;
		}
		const column = node.side === "USED_BY" ? -node.depth : node.depth;
		columns.set(column, [...(columns.get(column) ?? []), node]);
	}
	const rowOf = new Map<string, number>([[graph.rootId, 0]]);
	const columnKeys = [...columns.keys()].sort(
		(a, b) => Math.abs(a) - Math.abs(b),
	);
	const placed: PlacedGraphNode[] = [];
	for (const column of columnKeys) {
		const inColumn = columns.get(column) ?? [];
		const barycenter = (node: CatalogGraphNode): number => {
			const rows = (innerOf.get(node.id) ?? []).flatMap((inner) => {
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
				hiddenChildren: (outerOf.get(node.id) ?? []).filter(
					(outer) => !visible.has(outer),
				).length,
			});
		});
	}

	return {
		nodes: placed,
		edges: graph.edges.filter(
			(edge) => visible.has(edge.source) && visible.has(edge.target),
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
export interface GraphNodePaths {
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
 * The items to expand so a node deeper than the direct links shows: each one
 * between it and the owner, on its side, nearest the owner first. Following
 * them out from the owner reaches the node.
 *
 * @param graph - The graph.
 * @param id - The node to show.
 * @returns The ids to expand; empty for the owner or a direct link.
 */
export const getPathToNode = (
	graph: CatalogDependencyGraph,
	id: string,
): string[] => {
	const path: string[] = [];
	let current = graph.nodes.get(id);
	while (current && current.depth > 1) {
		const outer = current;
		const inner = graph.edges
			.map((edge) => getOutwardPair(edge, graph.nodes))
			.find((pair) => pair?.outer === outer.id)?.inner;
		if (!inner) {
			break;
		}
		path.unshift(inner);
		current = graph.nodes.get(inner);
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
