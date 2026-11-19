import type {
	DependencyDirection,
	DependencyGraph,
	DependencyGraphEdge,
	DependencyGraphNode,
	UserCatalogAccess,
} from "@/api/dependency-map";
import {
	getDependencyRoleLabel,
	getDependencyTypeConfig,
} from "@/features/catalog/dependencies/catalog-dependency";

/** A group of catalog types drawn in one colour on the map. */
export type DependencyFamily =
	| "MODEL"
	| "DATA"
	| "VECTOR"
	| "FUNCTION"
	| "GUARDRAIL"
	| "AGENT"
	| "APP";

/** How the map draws one family. */
interface FamilyConfig {
	/** Plural label for the legend */
	readonly label: string;
	/** Background class for the node's bar and the legend swatch */
	readonly swatchClass: string;
	/** Text class for the family's icon */
	readonly textClass: string;
	/** The colour as a CSS value, for the minimap's SVG fill */
	readonly color: string;
}

/**
 * Each family's colour, in legend order, from the design system's existing
 * tokens: the five series colours, the assistant's purple for agents and
 * skills, and the muted foreground for apps. Databases and storage share a
 * colour. The type's icon and label always name the type too, so colour is
 * never the only signal.
 */
export const DEPENDENCY_FAMILIES = {
	MODEL: {
		label: "Models",
		swatchClass: "bg-chart-1",
		textClass: "text-chart-1",
		color: "var(--color-chart-1)",
	},
	DATA: {
		label: "Databases & Storage",
		swatchClass: "bg-chart-2",
		textClass: "text-chart-2",
		color: "var(--color-chart-2)",
	},
	VECTOR: {
		label: "Vector Databases",
		swatchClass: "bg-chart-3",
		textClass: "text-chart-3",
		color: "var(--color-chart-3)",
	},
	FUNCTION: {
		label: "Functions",
		swatchClass: "bg-chart-4",
		textClass: "text-chart-4",
		color: "var(--color-chart-4)",
	},
	GUARDRAIL: {
		label: "Guardrails",
		swatchClass: "bg-chart-5",
		textClass: "text-chart-5",
		color: "var(--color-chart-5)",
	},
	AGENT: {
		label: "Agents & Skills",
		swatchClass: "bg-assistant",
		textClass: "text-assistant",
		color: "var(--color-assistant)",
	},
	APP: {
		label: "Apps",
		swatchClass: "bg-muted-foreground",
		textClass: "text-muted-foreground",
		color: "var(--color-muted-foreground)",
	},
} as const satisfies Record<DependencyFamily, FamilyConfig>;

/** The families in legend order. */
export const FAMILY_ORDER = Object.keys(
	DEPENDENCY_FAMILIES,
) as DependencyFamily[];

const TYPE_FAMILY: Readonly<Record<string, DependencyFamily>> = {
	MODEL: "MODEL",
	DATABASE: "DATA",
	STORAGE: "DATA",
	VECTOR: "VECTOR",
	FUNCTION: "FUNCTION",
	GUARDRAIL: "GUARDRAIL",
	WORKSPACE: "AGENT",
	SKILL: "AGENT",
};

/**
 * The family a catalog type is drawn in. A type the map does not know falls
 * back on whether it is a project.
 *
 * @param type - The item's catalog type.
 * @returns Its family.
 */
export const getDependencyFamily = (type: string): DependencyFamily =>
	TYPE_FAMILY[type] ??
	(getDependencyTypeConfig(type).kind === "project" ? "APP" : "DATA");

/** Lookups over a dependency network, built once per network. */
export interface DependencyGraphIndex {
	/** The network as read */
	readonly graph: DependencyGraph;
	/** Each node by id */
	readonly nodes: ReadonlyMap<string, DependencyGraphNode>;
	/** Each edge by id */
	readonly edges: ReadonlyMap<string, DependencyGraphEdge>;
	/** The links each item has: what it depends on */
	readonly outgoing: ReadonlyMap<string, readonly DependencyGraphEdge[]>;
	/** The links to each item: what depends on it */
	readonly incoming: ReadonlyMap<string, readonly DependencyGraphEdge[]>;
	/** Each node's family */
	readonly families: ReadonlyMap<string, DependencyFamily>;
	/** Lower-cased names and ids, for search */
	readonly searchable: readonly {
		readonly id: string;
		readonly name: string;
		readonly lowerId: string;
	}[];
}

const pushTo = <K, V>(map: Map<K, V[]>, key: K, value: V): void => {
	const list = map.get(key);
	if (list) {
		list.push(value);
	} else {
		map.set(key, [value]);
	}
};

/**
 * Indexes a network for lookups. Edges whose ends are not both nodes are left
 * out, since the canvas could not draw them.
 *
 * @param graph - The network.
 * @returns Its index.
 */
export const buildGraphIndex = (
	graph: DependencyGraph,
): DependencyGraphIndex => {
	const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
	const edges = new Map<string, DependencyGraphEdge>();
	const outgoing = new Map<string, DependencyGraphEdge[]>();
	const incoming = new Map<string, DependencyGraphEdge[]>();
	for (const edge of graph.edges) {
		if (!nodes.has(edge.source) || !nodes.has(edge.target)) {
			continue;
		}
		edges.set(edge.id, edge);
		pushTo(outgoing, edge.source, edge);
		pushTo(incoming, edge.target, edge);
	}
	return {
		graph,
		nodes,
		edges,
		outgoing,
		incoming,
		families: new Map(
			graph.nodes.map((node) => [
				node.id,
				getDependencyFamily(node.type),
			]),
		),
		searchable: graph.nodes.map((node) => ({
			id: node.id,
			name: node.name.toLowerCase(),
			lowerId: node.id.toLowerCase(),
		})),
	};
};

/** The items and links a trace reached. */
export interface TraceResult {
	/** The items, the root included */
	readonly nodeIds: ReadonlySet<string>;
	/** The links followed */
	readonly edgeIds: ReadonlySet<string>;
}

/**
 * Follows links one way from a root, breadth first.
 *
 * @param rootId - Where to start.
 * @param links - The links to follow from each item.
 * @param next - The item at the other end of a link.
 * @param depth - How many links to follow, or null for all of them.
 * @param nodeIds - Collects the items reached.
 * @param edgeIds - Collects the links followed.
 */
const walk = (
	rootId: string,
	links: ReadonlyMap<string, readonly DependencyGraphEdge[]>,
	next: (edge: DependencyGraphEdge) => string,
	depth: number | null,
	nodeIds: Set<string>,
	edgeIds: Set<string>,
): void => {
	const seen = new Set([rootId]);
	let frontier = [rootId];
	for (let level = 0; frontier.length > 0; level++) {
		if (depth !== null && level >= depth) {
			return;
		}
		const following: string[] = [];
		for (const id of frontier) {
			for (const edge of links.get(id) ?? []) {
				edgeIds.add(edge.id);
				const other = next(edge);
				nodeIds.add(other);
				if (!seen.has(other)) {
					seen.add(other);
					following.push(other);
				}
			}
		}
		frontier = following;
	}
};

/**
 * What an item uses, what uses it, or both, as far as `depth` links. Both
 * follows each way on its own, so an item's siblings (what else uses its
 * dependency) are not pulled in.
 *
 * @param index - The network.
 * @param rootId - The item.
 * @param direction - Which way to follow links.
 * @param depth - How many links to follow, or null for all of them.
 * @returns The items and links reached.
 */
export const traceGraph = (
	index: DependencyGraphIndex,
	rootId: string,
	direction: DependencyDirection,
	depth: number | null,
): TraceResult => {
	const nodeIds = new Set<string>();
	const edgeIds = new Set<string>();
	if (!index.nodes.has(rootId)) {
		return { nodeIds, edgeIds };
	}
	nodeIds.add(rootId);
	if (direction !== "DEPENDENTS") {
		walk(
			rootId,
			index.outgoing,
			(edge) => edge.target,
			depth,
			nodeIds,
			edgeIds,
		);
	}
	if (direction !== "DEPENDENCIES") {
		walk(
			rootId,
			index.incoming,
			(edge) => edge.source,
			depth,
			nodeIds,
			edgeIds,
		);
	}
	return { nodeIds, edgeIds };
};

/**
 * The items whose name or id contains the query, best first: an exact name,
 * then a name that starts with it, then a name that contains it, then an id
 * that contains it; ties by name.
 *
 * @param index - The network.
 * @param query - What was typed.
 * @returns The matching node ids, best first.
 */
export const searchNodes = (
	index: DependencyGraphIndex,
	query: string,
): string[] => {
	const needle = query.trim().toLowerCase();
	if (!needle) {
		return [];
	}
	const ranked: { id: string; name: string; rank: number }[] = [];
	for (const entry of index.searchable) {
		let rank = -1;
		if (entry.name === needle) {
			rank = 0;
		} else if (entry.name.startsWith(needle)) {
			rank = 1;
		} else if (entry.name.includes(needle)) {
			rank = 2;
		} else if (entry.lowerId.includes(needle)) {
			rank = 3;
		}
		if (rank >= 0) {
			ranked.push({ id: entry.id, name: entry.name, rank });
		}
	}
	ranked.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
	return ranked.map((entry) => entry.id);
};

/** Which links the map shows at full strength. */
export type LinkFilter = "ALL" | "AUTOMATIC" | "MANUAL" | (string & {});

/** The filters the toolbar sets. */
export interface DependencyMapFilters {
	/** The families shown, or null for all of them */
	readonly families: ReadonlySet<DependencyFamily> | null;
	/** All links, only automatic or manual ones, or one role */
	readonly links: LinkFilter;
}

/** The lens the map is viewed through. */
export type DependencyMapLens =
	| { readonly kind: "none" }
	| {
			readonly kind: "trace";
			readonly rootId: string;
			readonly direction: DependencyDirection;
			readonly depth: number | null;
	  }
	| {
			readonly kind: "access";
			/** The user's access, by item id; null while it is read */
			readonly access: ReadonlyMap<string, UserCatalogAccess> | null;
			readonly showGaps: boolean;
	  };

/** How strongly the map draws a node. */
export type NodeEmphasis = "normal" | "dimmed" | "match" | "traced" | "root";
/** How strongly the map draws an edge; a gap is drawn as a problem. */
export type EdgeEmphasis = "normal" | "dimmed" | "highlight" | "gap";

/** How the map draws every node and edge. */
export interface MapEmphasis {
	readonly nodes: ReadonlyMap<string, NodeEmphasis>;
	readonly edges: ReadonlyMap<string, EdgeEmphasis>;
}

/**
 * Whether a link passes the link filter.
 *
 * @param edge - The link.
 * @param links - The filter.
 * @returns Whether it is shown at full strength.
 */
const linkPasses = (edge: DependencyGraphEdge, links: LinkFilter): boolean => {
	if (links === "ALL") {
		return true;
	}
	if (links === "AUTOMATIC") {
		return edge.isAutomatic;
	}
	if (links === "MANUAL") {
		return !edge.isAutomatic;
	}
	return edge.role === links;
};

/**
 * Every link where the user can use the item that has the dependency but not
 * the item it depends on: what may fail for them. Links to deleted items are
 * left out.
 *
 * @param index - The network.
 * @param access - The user's access, by item id.
 * @returns The links.
 */
export const findAccessGaps = (
	index: DependencyGraphIndex,
	access: ReadonlyMap<string, UserCatalogAccess>,
): DependencyGraphEdge[] =>
	[...index.edges.values()].filter(
		(edge) =>
			access.has(edge.source) &&
			!access.has(edge.target) &&
			index.nodes.get(edge.target)?.missing !== true,
	);

/**
 * Works out how the map draws each node and edge. Nothing is ever removed, so
 * positions stay put; what a filter, lens or search leaves out is dimmed.
 *
 * @param index - The network.
 * @param filters - The toolbar's filters.
 * @param lens - The lens.
 * @param matches - The search's matches; empty when nothing is searched.
 * @returns Each node's and edge's emphasis.
 */
export const getMapEmphasis = (
	index: DependencyGraphIndex,
	filters: DependencyMapFilters,
	lens: DependencyMapLens,
	matches: ReadonlySet<string>,
): MapEmphasis => {
	const nodes = new Map<string, NodeEmphasis>();
	const edges = new Map<string, EdgeEmphasis>();
	const familyPasses = (id: string): boolean => {
		const family = index.families.get(id);
		return (
			filters.families === null ||
			(family !== undefined && filters.families.has(family))
		);
	};

	// the lens decides first: what it is about, and what it leaves out
	let lensNode: (node: DependencyGraphNode) => NodeEmphasis = () => "normal";
	let lensEdge: (edge: DependencyGraphEdge) => EdgeEmphasis = () => "normal";
	if (lens.kind === "trace") {
		const trace = traceGraph(
			index,
			lens.rootId,
			lens.direction,
			lens.depth,
		);
		lensNode = (node) =>
			node.id === lens.rootId
				? "root"
				: trace.nodeIds.has(node.id)
					? "traced"
					: "dimmed";
		lensEdge = (edge) =>
			trace.edgeIds.has(edge.id) ? "highlight" : "dimmed";
	} else if (lens.kind === "access" && lens.access) {
		const access = lens.access;
		lensNode = (node) => (access.has(node.id) ? "normal" : "dimmed");
		lensEdge = (edge) => {
			const canUseSource = access.has(edge.source);
			const canUseTarget = access.has(edge.target);
			if (
				lens.showGaps &&
				canUseSource &&
				!canUseTarget &&
				index.nodes.get(edge.target)?.missing !== true
			) {
				return "gap";
			}
			return canUseSource && canUseTarget ? "normal" : "dimmed";
		};
	}

	const isSearching = matches.size > 0;
	for (const node of index.nodes.values()) {
		let emphasis = familyPasses(node.id) ? lensNode(node) : "dimmed";
		if (isSearching) {
			emphasis = matches.has(node.id)
				? "match"
				: emphasis === "root"
					? "root"
					: "dimmed";
		}
		nodes.set(node.id, emphasis);
	}
	for (const edge of index.edges.values()) {
		const endsShown =
			nodes.get(edge.source) !== "dimmed" &&
			nodes.get(edge.target) !== "dimmed";
		const emphasis =
			linkPasses(edge, filters.links) &&
			familyPasses(edge.source) &&
			familyPasses(edge.target)
				? lensEdge(edge)
				: "dimmed";
		edges.set(
			edge.id,
			isSearching && !endsShown && emphasis !== "gap"
				? "dimmed"
				: emphasis,
		);
	}
	return { nodes, edges };
};

/**
 * Counts the items a trace reached by type, for the impact line, such as
 * "6 Agents, 3 Code".
 *
 * @param index - The network.
 * @param trace - The trace.
 * @param rootId - Its root, which is not counted.
 * @returns Each type's label and count, most first.
 */
export const summarizeImpact = (
	index: DependencyGraphIndex,
	trace: TraceResult,
	rootId: string,
): { label: string; count: number }[] => {
	const counts = new Map<string, number>();
	for (const id of trace.nodeIds) {
		const node = index.nodes.get(id);
		if (!node || id === rootId) {
			continue;
		}
		const label = getDependencyTypeConfig(node.type).label;
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}
	return [...counts]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

/** The words for a user's access level. */
export const ACCESS_LEVEL_LABELS = {
	1: "Owner",
	2: "Editor",
	3: "Read-only",
} as const satisfies Record<UserCatalogAccess["permission"], string>;

/** The words for where a user's access comes from. */
export const ACCESS_SOURCE_LABELS = {
	DIRECT: "Direct",
	TEAM: "Through a team",
	PUBLIC: "Public",
} as const satisfies Record<UserCatalogAccess["source"], string>;

/**
 * The words for a link: its role, and whether a person picked it.
 *
 * @param edge - The link.
 * @returns Its role's label, such as "Agent model", and its origin.
 */
export const describeLink = (
	edge: Pick<DependencyGraphEdge, "role" | "isAutomatic">,
): { role: string; origin: string } => ({
	role: getDependencyRoleLabel(edge.role),
	origin: edge.isAutomatic ? "Automatic" : "Manual",
});
