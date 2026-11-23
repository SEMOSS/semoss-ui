import { describe, expect, it } from "vitest";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogType,
} from "@semoss/shared";
import {
	type BuildCatalogDependencyGraphInput,
	buildCatalogDependencyGraph,
	type CatalogDependent,
	type DependencyGraphViewOptions,
	GRAPH_NODE_SIZE,
	getDependencyGraphView,
	getGraphBounds,
	getGraphNodePaths,
	getNodeLinks,
	getPathToNode,
	PRIVATE_DEPENDENTS_ID,
	searchCatalogGraph,
} from "./catalog-dependency-graph";

const node = (
	id: string,
	type: CatalogType,
	fields: Partial<CatalogDependency> = {},
): CatalogDependency => ({
	catalog_id: id,
	catalog_type: type,
	catalog_name: id.toUpperCase(),
	permission_name: "READ_ONLY",
	is_private: false,
	...fields,
});

const link = (
	parent: string,
	target: string,
	fields: Partial<CatalogDependencyLink> = {},
): CatalogDependencyLink => ({
	parent_id: parent,
	catalog_id: target,
	is_automatic: true,
	role: "AGENT_MODEL",
	dependency_name: null,
	dependency_description: null,
	...fields,
});

const dependent = (
	id: string,
	on: string,
	fields: Partial<CatalogDependent> = {},
): CatalogDependent => ({
	dependency_id: on,
	catalog_id: id,
	catalog_type: "WORKSPACE",
	catalog_name: id.toUpperCase(),
	is_automatic: false,
	role: "MANUAL",
	dependency_name: null,
	dependency_description: null,
	...fields,
});

const ROOT = { id: "agent", type: "WORKSPACE", name: "Agent" } as const;

const input = (
	overrides: Partial<BuildCatalogDependencyGraphInput> = {},
): BuildCatalogDependencyGraphInput => ({
	root: ROOT,
	nodes: [
		node("model", "MODEL"),
		node("vector", "VECTOR", {
			permission_name: undefined,
			catalog_discoverable: true,
		}),
		node("embedder", "MODEL"),
		node("db", "DATABASE", {
			permission_name: undefined,
			catalog_name: undefined,
			is_private: true,
		}),
	],
	links: [
		link("agent", "model"),
		link("agent", "vector", { role: "KNOWLEDGE" }),
		link("vector", "embedder", { role: "EMBEDDER" }),
		link("agent", "db", {
			is_automatic: false,
			role: "MANUAL",
			dependency_name: "PAYROLL",
		}),
	],
	dependents: [dependent("app", "agent"), dependent("portal", "app")],
	hiddenCount: 0,
	...overrides,
});

const DIRECT: DependencyGraphViewOptions = { expandedIds: new Set<string>() };

/** Every level shown: each item two links out has its parent expanded. */
const ALL: DependencyGraphViewOptions = {
	expandedIds: new Set<string>(["vector", "app"]),
};

describe("buildCatalogDependencyGraph", () => {
	it("places each item at its depth on its side", () => {
		const graph = buildCatalogDependencyGraph(input());
		expect(graph.nodes.get("agent")).toMatchObject({
			side: "ROOT",
			depth: 0,
		});
		expect(graph.nodes.get("model")).toMatchObject({
			side: "USES",
			depth: 1,
		});
		expect(graph.nodes.get("embedder")).toMatchObject({
			side: "USES",
			depth: 2,
		});
		expect(graph.nodes.get("app")).toMatchObject({
			side: "USED_BY",
			depth: 1,
		});
		expect(graph.nodes.get("portal")).toMatchObject({
			side: "USED_BY",
			depth: 2,
		});
	});

	it("names a private dependency by its type and keeps nothing else", () => {
		const db = buildCatalogDependencyGraph(input()).nodes.get("db");
		expect(db).toMatchObject({
			name: "Private Database",
			isPrivate: true,
			subtype: null,
			description: null,
			access: { kind: "private" },
		});
	});

	it("masks a private dependency an older backend still names", () => {
		const graph = buildCatalogDependencyGraph(
			input({
				nodes: [
					node("db", "DATABASE", {
						permission_name: undefined,
						is_private: undefined,
						catalog_name: "Payroll",
						description: "Salaries",
					}),
				],
				links: [link("agent", "db")],
			}),
		);
		expect(graph.nodes.get("db")).toMatchObject({
			name: "Private Database",
			description: null,
		});
	});

	it("keeps one node and an edge per role for a target in two roles", () => {
		const graph = buildCatalogDependencyGraph(
			input({
				links: [
					link("agent", "model"),
					link("agent", "model", {
						role: "MANUAL",
						is_automatic: false,
					}),
				],
			}),
		);
		expect(
			[...graph.nodes.values()].filter((n) => n.id === "model"),
		).toHaveLength(1);
		expect(getNodeLinks(graph, "model").usedBy).toHaveLength(2);
	});

	it("ends a cycle where it was first reached", () => {
		const graph = buildCatalogDependencyGraph(
			input({
				links: [link("agent", "model"), link("model", "agent")],
				dependents: [],
			}),
		);
		expect(graph.nodes.get("agent")?.side).toBe("ROOT");
		expect(graph.edges).toHaveLength(2);
	});

	it("stands one node for the dependents the user cannot view", () => {
		const graph = buildCatalogDependencyGraph(
			input({
				// "portal" uses "hidden", which the backend did not list
				dependents: [dependent("portal", "hidden")],
				hiddenCount: 2,
			}),
		);
		const hidden = graph.nodes.get(PRIVATE_DEPENDENTS_ID);
		expect(hidden).toMatchObject({
			name: "2 hidden items",
			hiddenCount: 2,
			side: "USED_BY",
			depth: 1,
		});
		expect(graph.nodes.get("portal")?.depth).toBe(2);
		expect(getNodeLinks(graph, "portal").uses[0]?.other.id).toBe(
			PRIVATE_DEPENDENTS_ID,
		);
	});

	it("tells nothing about the access of a target whose access is unknown", () => {
		const graph = buildCatalogDependencyGraph(
			input({ unknownAccessIds: new Set(["model"]) }),
		);
		expect(graph.nodes.get("model")?.access).toBeNull();
		expect(graph.nodes.get("vector")?.access).toEqual({
			kind: "requestable",
		});
	});

	it("adds no private node when nothing is hidden", () => {
		const graph = buildCatalogDependencyGraph(input());
		expect(graph.nodes.has(PRIVATE_DEPENDENTS_ID)).toBe(false);
	});
});

describe("getDependencyGraphView", () => {
	it("lays what uses the owner left of it and what it uses right", () => {
		const view = getDependencyGraphView(
			buildCatalogDependencyGraph(input()),
			ALL,
		);
		const x = (id: string) => view.nodes.find((n) => n.id === id)?.x ?? NaN;
		expect(x("agent")).toBe(0);
		expect(x("app")).toBeLessThan(0);
		expect(x("portal")).toBeLessThan(x("app"));
		expect(x("model")).toBeGreaterThan(0);
		expect(x("embedder")).toBeGreaterThan(x("model"));
	});

	it("draws the same graph the same way every time", () => {
		const first = getDependencyGraphView(
			buildCatalogDependencyGraph(input()),
			ALL,
		);
		const second = getDependencyGraphView(
			buildCatalogDependencyGraph({
				...input(),
				nodes: [...input().nodes].reverse(),
			}),
			ALL,
		);
		const place = (view: typeof first) =>
			Object.fromEntries(view.nodes.map((n) => [n.id, [n.x, n.y]]));
		expect(place(second)).toEqual(place(first));
	});

	it("stops at the direct links and counts what it leaves out", () => {
		const view = getDependencyGraphView(
			buildCatalogDependencyGraph(input()),
			DIRECT,
		);
		expect(view.nodes.map((n) => n.id)).not.toContain("embedder");
		expect(view.nodes.find((n) => n.id === "vector")?.hiddenChildren).toBe(
			1,
		);
		expect(view.nodes.find((n) => n.id === "app")?.hiddenChildren).toBe(1);
	});

	it("shows the next level of an expanded node past the direct links", () => {
		const view = getDependencyGraphView(
			buildCatalogDependencyGraph(input()),
			{ expandedIds: new Set<string>(["vector"]) },
		);
		expect(view.nodes.map((n) => n.id)).toContain("embedder");
		expect(view.nodes.find((n) => n.id === "vector")?.hiddenChildren).toBe(
			0,
		);
		expect(view.nodes.map((n) => n.id)).not.toContain("portal");
	});
});

describe("getGraphBounds", () => {
	it("covers every node shown, with its size", () => {
		const view = getDependencyGraphView(
			buildCatalogDependencyGraph(input()),
			ALL,
		);
		const bounds = getGraphBounds(view);
		for (const node of view.nodes) {
			expect(node.x).toBeGreaterThanOrEqual(bounds.x);
			expect(node.x + GRAPH_NODE_SIZE.width).toBeLessThanOrEqual(
				bounds.x + bounds.width,
			);
		}
		expect(getGraphBounds({ nodes: [], edges: [] }).width).toBe(0);
	});
});

describe("getPathToNode", () => {
	it("lists the items to expand, nearest the owner first", () => {
		const graph = buildCatalogDependencyGraph(input());
		expect(getPathToNode(graph, "embedder")).toEqual(["vector"]);
		expect(getPathToNode(graph, "portal")).toEqual(["app"]);
		expect(getPathToNode(graph, "model")).toEqual([]);
		expect(getPathToNode(graph, "agent")).toEqual([]);
	});

	it("shows the node once each is expanded", () => {
		const graph = buildCatalogDependencyGraph(input());
		const view = getDependencyGraphView(graph, {
			expandedIds: new Set(getPathToNode(graph, "embedder")),
		});
		expect(view.nodes.map((n) => n.id)).toContain("embedder");
	});
});

describe("getNodeLinks", () => {
	it("pairs each link with the item at its other end", () => {
		const graph = buildCatalogDependencyGraph(input());
		const { uses, usedBy } = getNodeLinks(graph, "vector");
		expect(uses.map((l) => l.other.id)).toEqual(["embedder"]);
		expect(usedBy.map((l) => [l.other.id, l.sourceType])).toEqual([
			["agent", "WORKSPACE"],
		]);
	});
});

describe("getGraphNodePaths", () => {
	it("opens an item the user can use, and follows its ontology", () => {
		const graph = buildCatalogDependencyGraph(input());
		const model = graph.nodes.get("model");
		expect(model && getGraphNodePaths(graph, model)).toEqual({
			catalogPath: "/model/model",
			ontologyPath: "/model/model/ontology",
		});
	});

	it("opens nothing for the owner, a private item or a type with no page", () => {
		const graph = buildCatalogDependencyGraph(
			input({
				nodes: [
					...input().nodes,
					node("odd", "SOMETHING_NEW" as CatalogType),
				],
				links: [...input().links, link("agent", "odd")],
			}),
		);
		const none = { catalogPath: null, ontologyPath: null };
		for (const id of ["agent", "db", "odd"]) {
			const found = graph.nodes.get(id);
			expect(found && getGraphNodePaths(graph, found)).toEqual(none);
		}
	});

	it("encodes the id in the path", () => {
		const graph = buildCatalogDependencyGraph(
			input({
				nodes: [node("a/b", "MODEL")],
				links: [link("agent", "a/b")],
			}),
		);
		const found = graph.nodes.get("a/b");
		expect(found && getGraphNodePaths(graph, found).catalogPath).toBe(
			"/model/a%2Fb",
		);
	});
});

describe("searchCatalogGraph", () => {
	it("ranks names, then ids, and never matches a private item's id", () => {
		const graph = buildCatalogDependencyGraph(input());
		expect(searchCatalogGraph(graph, "MODEL")).toEqual(["model"]);
		expect(searchCatalogGraph(graph, "e")).toContain("embedder");
		// the private database is found by the name the user sees
		expect(searchCatalogGraph(graph, "private")).toEqual(["db"]);
		expect(searchCatalogGraph(graph, "db")).toEqual([]);
		expect(searchCatalogGraph(graph, "  ")).toEqual([]);
		// the owner is not a result
		expect(searchCatalogGraph(graph, "agent")).toEqual([]);
	});
});
