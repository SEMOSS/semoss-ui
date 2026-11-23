import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
} from "@semoss/shared";
import { useCatalogDependencies } from "./use-catalog-dependencies";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	refresh: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
}));

const MODEL: CatalogDependency = {
	catalog_id: "model-1",
	catalog_type: "MODEL",
	catalog_name: "GPT",
	description: "The model's own catalog description",
};

const SKILL: CatalogDependency = {
	catalog_id: "skill-1",
	catalog_type: "SKILL",
	catalog_name: "Search",
};

/** A manual link from one owner to a target. */
const manualLink = (
	parentId: string,
	catalogId: string,
	overrides: Partial<CatalogDependencyLink> = {},
): CatalogDependencyLink => ({
	parent_id: parentId,
	catalog_id: catalogId,
	is_automatic: false,
	role: "MANUAL",
	dependency_name: null,
	dependency_description: null,
	...overrides,
});

/** The row a link to a node joins into. */
const toRow = (
	node: CatalogDependency,
	{ parent_id: _parentId, ...link }: CatalogDependencyLink,
): CatalogDependencyRow => ({ ...node, ...link });

/** Make usePixel return the given state. */
const pixelState = (state: {
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	data?: unknown;
	error?: Error;
}) =>
	mocks.usePixel.mockReturnValue({
		data: { dependencies: [], dependencyIds: [] },
		refresh: mocks.refresh,
		...state,
	});

beforeEach(() => {
	mocks.usePixel.mockReset();
	mocks.refresh.mockReset();
});

describe("useCatalogDependencies", () => {
	it("reads nothing until the owner's type is known", () => {
		pixelState({ status: "INITIAL" });
		const { result } = renderHook(() =>
			useCatalogDependencies({
				catalogId: "app-1",
				catalogType: undefined,
			}),
		);
		expect(mocks.usePixel.mock.calls[0]?.[0]).toBe("");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.dependencies).toEqual([]);
	});

	it("reads the owner's dependencies with its specific type", () => {
		pixelState({ status: "LOADING" });
		const { result } = renderHook(() =>
			useCatalogDependencies({
				catalogId: "fn-1",
				catalogType: "FUNCTION",
			}),
		);
		expect(mocks.usePixel.mock.calls[0]?.[0]).toBe(
			'GetCatalogDependencies(catalogId="fn-1", catalogType="FUNCTION");',
		);
		expect(result.current.isLoading).toBe(true);
	});

	it("returns the owner's rows and refresh once read", () => {
		const link = manualLink("app-1", "model-1");
		pixelState({
			status: "SUCCESS",
			data: {
				dependencies: [MODEL],
				dependencyIds: ["model-1"],
				links: [link],
			},
		});
		const { result } = renderHook(() =>
			useCatalogDependencies({ catalogId: "app-1", catalogType: "CODE" }),
		);
		expect(result.current).toMatchObject({
			dependencies: [toRow(MODEL, link)],
			isLoading: false,
			error: undefined,
		});
		result.current.refresh();
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});

	it("keeps a dependency's own links out of the owner's rows", () => {
		// the app depends on the skill, and the skill on the model
		const appToSkill = manualLink("app-1", "skill-1");
		pixelState({
			status: "SUCCESS",
			data: {
				dependencies: [SKILL, MODEL],
				dependencyIds: ["skill-1"],
				links: [appToSkill, manualLink("skill-1", "model-1")],
			},
		});
		const { result } = renderHook(() =>
			useCatalogDependencies({ catalogId: "app-1", catalogType: "CODE" }),
		);
		expect(result.current.dependencies).toEqual([toRow(SKILL, appToSkill)]);
		expect(result.current.allDependencies).toEqual([SKILL, MODEL]);
	});

	it("joins a target with two roles into two rows", () => {
		const SUBAGENT: CatalogDependency = {
			catalog_id: "agent-2",
			catalog_type: "WORKSPACE",
			catalog_name: "Researcher",
		};
		const agentModel = manualLink("agent-1", "model-1", {
			is_automatic: true,
			role: "AGENT_MODEL",
			dependency_description: "The agent answers with this model",
		});
		const subagent = manualLink("agent-1", "agent-2", {
			is_automatic: true,
			role: "SUBAGENT",
		});
		const manualModel = manualLink("agent-1", "model-1", {
			dependency_name: "Drafting",
			dependency_description: "Writes the first draft",
		});
		pixelState({
			status: "SUCCESS",
			data: {
				dependencies: [MODEL, SUBAGENT],
				dependencyIds: ["model-1", "agent-2"],
				links: [agentModel, subagent, manualModel],
			},
		});
		const { result } = renderHook(() =>
			useCatalogDependencies({
				catalogId: "agent-1",
				catalogType: "WORKSPACE",
			}),
		);
		expect(result.current.dependencies).toEqual([
			toRow(MODEL, agentModel),
			toRow(SUBAGENT, subagent),
			toRow(MODEL, manualModel),
		]);
	});

	it("reads a response without links as manual rows", () => {
		pixelState({
			status: "SUCCESS",
			data: { dependencies: [SKILL, MODEL], dependencyIds: ["skill-1"] },
		});
		const { result } = renderHook(() =>
			useCatalogDependencies({ catalogId: "app-1", catalogType: "CODE" }),
		);
		expect(result.current.dependencies).toEqual([
			toRow(SKILL, manualLink("app-1", "skill-1")),
		]);
	});

	it("surfaces a failed read", () => {
		const error = new Error("no access");
		pixelState({ status: "ERROR", error });
		const { result } = renderHook(() =>
			useCatalogDependencies({
				catalogId: "skill-1",
				catalogType: "SKILL",
			}),
		);
		expect(result.current.error).toBe(error);
		expect(result.current.isLoading).toBe(false);
	});

	it("reads again when the owner changes", () => {
		pixelState({ status: "LOADING" });
		const { rerender } = renderHook(
			({ id }: { id: string }) =>
				useCatalogDependencies({ catalogId: id, catalogType: "MODEL" }),
			{ initialProps: { id: "model-1" } },
		);
		rerender({ id: "model-2" });
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
			'catalogId="model-2"',
		);
	});

	it("keeps the rows already read while a refresh is waiting", () => {
		const link = manualLink("app-1", "model-1");
		const data = {
			dependencies: [MODEL],
			dependencyIds: ["model-1"],
			links: [link],
		};
		pixelState({ status: "SUCCESS", data });
		const { result, rerender } = renderHook(() =>
			useCatalogDependencies({ catalogId: "app-1", catalogType: "CODE" }),
		);
		act(() => {
			mocks.usePixel.mock.lastCall?.[1]?.onSuccess(data);
		});

		pixelState({ status: "LOADING" });
		rerender();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.dependencies).toEqual([toRow(MODEL, link)]);
	});

	it("does not keep another owner's rows", () => {
		const data = {
			dependencies: [MODEL],
			dependencyIds: ["model-1"],
			links: [manualLink("app-1", "model-1")],
		};
		pixelState({ status: "SUCCESS", data });
		const { result, rerender } = renderHook(
			({ id }: { id: string }) =>
				useCatalogDependencies({ catalogId: id, catalogType: "CODE" }),
			{ initialProps: { id: "app-1" } },
		);
		act(() => {
			mocks.usePixel.mock.lastCall?.[1]?.onSuccess(data);
		});

		pixelState({ status: "LOADING" });
		rerender({ id: "app-2" });
		expect(result.current.isLoading).toBe(true);
		expect(result.current.dependencies).toEqual([]);
	});
});
