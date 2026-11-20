import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildDependencyGraphPixel,
	buildUserCatalogAccessPixel,
	parseDependencyGraph,
	parseUserCatalogAccess,
	syncAutomaticDependencies,
} from "./dependency-map";

const mocks = vi.hoisted(() => ({ runPixel: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({ runPixel: mocks.runPixel }));

afterEach(() => {
	mocks.runPixel.mockReset();
});

describe("buildDependencyGraphPixel", () => {
	it("reads the whole platform with no scope", () => {
		expect(buildDependencyGraphPixel(null)).toBe(
			"AdminGetCatalogDependencyGraph();",
		);
	});

	it("reads the network around one item, escaping its id", () => {
		expect(
			buildDependencyGraphPixel({
				catalogId: 'a"b',
				direction: "DEPENDENTS",
				depth: 2,
			}),
		).toBe(
			'AdminGetCatalogDependencyGraph(catalogId=["a\\"b"], direction=["DEPENDENTS"], depth=[2]);',
		);
		expect(
			buildDependencyGraphPixel({
				catalogId: "x",
				direction: "BOTH",
				depth: null,
			}),
		).toBe(
			'AdminGetCatalogDependencyGraph(catalogId=["x"], direction=["BOTH"]);',
		);
	});
});

describe("parseDependencyGraph", () => {
	it("fills the fields Pixel leaves out", () => {
		const graph = parseDependencyGraph({
			nodes: [
				{
					id: "m",
					kind: "ENGINE",
					type: "MODEL",
					name: "Model",
					x: 1,
					y: 2,
				},
			],
			edges: [{ id: "a|m|AGENT_MODEL", source: "a", target: "m" }],
			bounds: { width: 10, height: 10 },
		});
		expect(graph.nodes[0]).toMatchObject({
			description: null,
			missing: false,
			dependencyCount: 0,
		});
		expect(graph.edges[0]).toMatchObject({
			role: "MANUAL",
			isAutomatic: false,
			inCycle: false,
		});
		expect(graph.nodeSize).toEqual({ width: 240, height: 64 });
	});

	it("refuses a reply that is not a network", () => {
		expect(() => parseDependencyGraph({ nodes: "no" })).toThrow(
			"The dependency map response could not be read.",
		);
	});
});

describe("user access", () => {
	it("reads nothing without a user", () => {
		expect(buildUserCatalogAccessPixel("")).toBe("");
		expect(buildUserCatalogAccessPixel("u1")).toBe(
			'AdminGetUserCatalogAccess(userId=["u1"]);',
		);
	});

	it("refuses an access level it does not know", () => {
		expect(() =>
			parseUserCatalogAccess({
				userId: "u1",
				access: [
					{
						id: "x",
						kind: "ENGINE",
						permission: 4,
						source: "DIRECT",
					},
				],
			}),
		).toThrow("The user access response could not be read.");
	});
});

describe("syncAutomaticDependencies", () => {
	it("returns what the backfill read", async () => {
		mocks.runPixel.mockResolvedValue({
			pixelReturn: [
				{
					operationType: ["OPERATION"],
					output: {
						engines: 3,
						agents: 2,
						automations: 0,
						blocks: 1,
						code: 4,
						failed: ["x"],
					},
				},
			],
		});
		await expect(syncAutomaticDependencies()).resolves.toEqual({
			engines: 3,
			agents: 2,
			automations: 0,
			blocks: 1,
			code: 4,
			failed: ["x"],
		});
		expect(mocks.runPixel).toHaveBeenCalledWith(
			"AdminBackfillCatalogDependencies();",
		);
	});

	it("fails with the backend's reason", async () => {
		mocks.runPixel.mockResolvedValue({
			pixelReturn: [{ operationType: ["ERROR"], output: "Not an admin" }],
		});
		await expect(syncAutomaticDependencies()).rejects.toThrow(
			"Not an admin",
		);
	});
});
