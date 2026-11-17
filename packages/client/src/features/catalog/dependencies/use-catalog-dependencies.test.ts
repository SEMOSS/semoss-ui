import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogDependency } from "@semoss/shared";
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
};

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

	it("returns the dependencies and refresh once read", () => {
		pixelState({
			status: "SUCCESS",
			data: { dependencies: [MODEL], dependencyIds: ["model-1"] },
		});
		const { result } = renderHook(() =>
			useCatalogDependencies({ catalogId: "app-1", catalogType: "CODE" }),
		);
		expect(result.current).toMatchObject({
			dependencies: [MODEL],
			dependencyIds: ["model-1"],
			isLoading: false,
			error: undefined,
		});
		result.current.refresh();
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});

	it("keeps a dependency's own dependencies out of the owner's list", () => {
		const SKILL: CatalogDependency = {
			catalog_id: "skill-1",
			catalog_type: "SKILL",
			catalog_name: "Search",
		};
		// the app depends on the skill, and the skill on the model
		pixelState({
			status: "SUCCESS",
			data: { dependencies: [SKILL, MODEL], dependencyIds: ["skill-1"] },
		});
		const { result } = renderHook(() =>
			useCatalogDependencies({ catalogId: "app-1", catalogType: "CODE" }),
		);
		expect(result.current.dependencies).toEqual([SKILL]);
		expect(result.current.allDependencies).toEqual([SKILL, MODEL]);
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
});
