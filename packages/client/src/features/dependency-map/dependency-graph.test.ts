import { describe, expect, it } from "vitest";
import type {
	DependencyGraph,
	DependencyGraphEdge,
	DependencyGraphNode,
	UserCatalogAccess,
} from "@/api/dependency-map";
import {
	buildGraphIndex,
	type DependencyMapFilters,
	findAccessGaps,
	getDependencyFamily,
	getMapEmphasis,
	searchNodes,
	summarizeImpact,
	traceGraph,
} from "./dependency-graph";

const node = (
	id: string,
	type: string,
	overrides: Partial<DependencyGraphNode> = {},
): DependencyGraphNode => ({
	id,
	kind: ["MODEL", "VECTOR", "DATABASE", "GUARDRAIL"].includes(type)
		? "ENGINE"
		: "PROJECT",
	type,
	subtype: null,
	name: id,
	description: null,
	discoverable: false,
	global: false,
	createdBy: null,
	dateCreated: null,
	missing: false,
	x: 0,
	y: 0,
	component: 0,
	dependencyCount: 0,
	dependentCount: 0,
	...overrides,
});

const edge = (
	source: string,
	target: string,
	overrides: Partial<DependencyGraphEdge> = {},
): DependencyGraphEdge => ({
	id: `${source}|${target}|${overrides.role ?? "MANUAL"}`,
	source,
	target,
	role: "MANUAL",
	isAutomatic: false,
	name: null,
	description: null,
	dateAdded: null,
	addedBy: null,
	inCycle: false,
	...overrides,
});

/**
 * app -> agent -> model -> guardrail
 *        agent -> vector -> model
 * other-agent -> model
 * gone (deleted) <- app
 * lonely (no links)
 */
const graph: DependencyGraph = {
	nodes: [
		node("app", "CODE", { name: "Claims App" }),
		node("agent", "WORKSPACE", { name: "Claims Agent" }),
		node("other-agent", "WORKSPACE", { name: "Triage Agent" }),
		node("model", "MODEL", { name: "GPT Model" }),
		node("vector", "VECTOR", { name: "Policies" }),
		node("guardrail", "GUARDRAIL", { name: "PII Guard" }),
		node("gone", "DATABASE", { missing: true }),
		node("lonely", "DATABASE", { name: "Claims" }),
	],
	edges: [
		edge("app", "agent", { role: "AUTOMATION_NODE", isAutomatic: true }),
		edge("agent", "model", { role: "AGENT_MODEL", isAutomatic: true }),
		edge("agent", "vector", { role: "KNOWLEDGE", isAutomatic: true }),
		edge("vector", "model", { role: "EMBEDDER", isAutomatic: true }),
		edge("model", "guardrail", { role: "GUARDRAIL", isAutomatic: true }),
		edge("other-agent", "model", {
			role: "AGENT_MODEL",
			isAutomatic: true,
		}),
		edge("app", "gone"),
		edge("app", "nowhere"),
	],
	stats: {
		nodes: 8,
		edges: 7,
		automatic: 6,
		manual: 1,
		missing: 1,
		isolated: 1,
		cycles: 0,
		components: 2,
	},
	bounds: { width: 1000, height: 1000 },
	nodeSize: { width: 240, height: 64 },
};

const index = buildGraphIndex(graph);
const noFilters: DependencyMapFilters = { families: null, links: "ALL" };

describe("buildGraphIndex", () => {
	it("leaves out links to items that are not on the map", () => {
		expect(index.edges.has("app|nowhere|MANUAL")).toBe(false);
		expect(index.edges.size).toBe(7);
	});
});

describe("getDependencyFamily", () => {
	it("groups agents with skills and apps together", () => {
		expect(getDependencyFamily("WORKSPACE")).toBe("AGENT");
		expect(getDependencyFamily("SKILL")).toBe("AGENT");
		expect(getDependencyFamily("BLOCKS")).toBe("APP");
		expect(getDependencyFamily("INSIGHTS")).toBe("APP");
		expect(getDependencyFamily("MODEL")).toBe("MODEL");
	});
});

describe("traceGraph", () => {
	it("follows what an item uses, all the way", () => {
		const trace = traceGraph(index, "agent", "DEPENDENCIES", null);
		expect([...trace.nodeIds].sort()).toEqual([
			"agent",
			"guardrail",
			"model",
			"vector",
		]);
		expect(trace.edgeIds.has("app|agent|AUTOMATION_NODE")).toBe(false);
	});

	it("stops at the depth", () => {
		const trace = traceGraph(index, "agent", "DEPENDENCIES", 1);
		expect([...trace.nodeIds].sort()).toEqual(["agent", "model", "vector"]);
	});

	it("follows what uses an item, without pulling in its siblings", () => {
		const trace = traceGraph(index, "vector", "DEPENDENTS", null);
		expect([...trace.nodeIds].sort()).toEqual(["agent", "app", "vector"]);
		expect(trace.nodeIds.has("other-agent")).toBe(false);
	});

	it("follows both ways separately", () => {
		const trace = traceGraph(index, "vector", "BOTH", 1);
		expect([...trace.nodeIds].sort()).toEqual(["agent", "model", "vector"]);
	});

	it("finds nothing for an item not on the map", () => {
		expect(traceGraph(index, "missing-id", "BOTH", null).nodeIds.size).toBe(
			0,
		);
	});
});

describe("searchNodes", () => {
	it("ranks an exact name, then a prefix, then a substring, then an id", () => {
		const local = buildGraphIndex({
			...graph,
			nodes: [
				node("x1", "CODE", { name: "My Claims" }),
				node("x2", "CODE", { name: "Claims Portal" }),
				node("claims", "CODE", { name: "Other" }),
				node("x3", "CODE", { name: "Claims" }),
			],
			edges: [],
		});
		expect(searchNodes(local, " claims ")).toEqual([
			"x3",
			"x2",
			"x1",
			"claims",
		]);
	});

	it("finds nothing for an empty search", () => {
		expect(searchNodes(index, "  ")).toEqual([]);
	});
});

describe("getMapEmphasis", () => {
	it("draws everything normally with no lens, filter or search", () => {
		const { nodes, edges } = getMapEmphasis(
			index,
			noFilters,
			{ kind: "none" },
			new Set(),
		);
		expect(new Set(nodes.values())).toEqual(new Set(["normal"]));
		expect(new Set(edges.values())).toEqual(new Set(["normal"]));
	});

	it("dims the families filtered out and their links", () => {
		const { nodes, edges } = getMapEmphasis(
			index,
			{ families: new Set(["AGENT", "MODEL"]), links: "ALL" },
			{ kind: "none" },
			new Set(),
		);
		expect(nodes.get("agent")).toBe("normal");
		expect(nodes.get("vector")).toBe("dimmed");
		expect(edges.get("agent|model|AGENT_MODEL")).toBe("normal");
		expect(edges.get("agent|vector|KNOWLEDGE")).toBe("dimmed");
	});

	it("dims links outside the link filter", () => {
		const manual = getMapEmphasis(
			index,
			{ families: null, links: "MANUAL" },
			{ kind: "none" },
			new Set(),
		);
		expect(manual.edges.get("app|gone|MANUAL")).toBe("normal");
		expect(manual.edges.get("agent|model|AGENT_MODEL")).toBe("dimmed");
		const role = getMapEmphasis(
			index,
			{ families: null, links: "EMBEDDER" },
			{ kind: "none" },
			new Set(),
		);
		expect(role.edges.get("vector|model|EMBEDDER")).toBe("normal");
		expect(role.edges.get("agent|model|AGENT_MODEL")).toBe("dimmed");
	});

	it("marks the trace's root and reach, and dims the rest", () => {
		const { nodes, edges } = getMapEmphasis(
			index,
			noFilters,
			{
				kind: "trace",
				rootId: "agent",
				direction: "DEPENDENCIES",
				depth: 1,
			},
			new Set(),
		);
		expect(nodes.get("agent")).toBe("root");
		expect(nodes.get("model")).toBe("traced");
		expect(nodes.get("guardrail")).toBe("dimmed");
		expect(edges.get("agent|model|AGENT_MODEL")).toBe("highlight");
		expect(edges.get("model|guardrail|GUARDRAIL")).toBe("dimmed");
	});

	it("dims what a user cannot use and marks their gaps", () => {
		const access = new Map<string, UserCatalogAccess>([
			[
				"agent",
				{
					id: "agent",
					kind: "PROJECT",
					permission: 3,
					source: "DIRECT",
				},
			],
			[
				"vector",
				{ id: "vector", kind: "ENGINE", permission: 3, source: "TEAM" },
			],
		]);
		const { nodes, edges } = getMapEmphasis(
			index,
			noFilters,
			{ kind: "access", access, showGaps: true },
			new Set(),
		);
		expect(nodes.get("agent")).toBe("normal");
		expect(nodes.get("model")).toBe("dimmed");
		expect(edges.get("agent|vector|KNOWLEDGE")).toBe("normal");
		expect(edges.get("agent|model|AGENT_MODEL")).toBe("gap");
		expect(edges.get("vector|model|EMBEDDER")).toBe("gap");
		expect(edges.get("app|agent|AUTOMATION_NODE")).toBe("dimmed");
	});

	it("highlights search matches over the lens, keeping the trace's root", () => {
		const { nodes } = getMapEmphasis(
			index,
			noFilters,
			{ kind: "trace", rootId: "agent", direction: "BOTH", depth: null },
			new Set(["lonely"]),
		);
		expect(nodes.get("lonely")).toBe("match");
		expect(nodes.get("agent")).toBe("root");
		expect(nodes.get("model")).toBe("dimmed");
	});
});

describe("findAccessGaps", () => {
	it("lists links the user cannot follow, leaving out deleted items", () => {
		const access = new Map<string, UserCatalogAccess>([
			[
				"app",
				{ id: "app", kind: "PROJECT", permission: 1, source: "DIRECT" },
			],
		]);
		expect(findAccessGaps(index, access).map((gap) => gap.id)).toEqual([
			"app|agent|AUTOMATION_NODE",
		]);
	});
});

describe("summarizeImpact", () => {
	it("counts what a trace reached by type, without the root", () => {
		const trace = traceGraph(index, "model", "DEPENDENTS", null);
		expect(summarizeImpact(index, trace, "model")).toEqual([
			{ label: "Agent", count: 2 },
			{ label: "Code", count: 1 },
			{ label: "Vector", count: 1 },
		]);
	});
});
