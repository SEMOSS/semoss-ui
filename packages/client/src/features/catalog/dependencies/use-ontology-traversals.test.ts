import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTraversalKey } from "./catalog-dependency-graph";
import { useOntologyTraversals } from "./use-ontology-traversals";

const mocks = vi.hoisted(() => ({
	getCatalogDependents: vi.fn(),
	getCatalogDependencies: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("@/api/catalog-dependencies", () => ({
	getCatalogDependents: mocks.getCatalogDependents,
	getCatalogDependencies: mocks.getCatalogDependencies,
}));

vi.mock("@semoss/ui/next", () => ({
	toast: { error: mocks.toastError },
}));

afterEach(() => {
	vi.clearAllMocks();
});

const MODEL = { id: "model-1", type: "MODEL" };

describe("useOntologyTraversals", () => {
	it("shows a way already known at once, without reading", async () => {
		const { result } = renderHook(() => useOntologyTraversals());
		await act(() => result.current.traverse(MODEL, "UPSTREAM", true));
		expect(
			result.current.traversals.has(
				getTraversalKey("model-1", "UPSTREAM"),
			),
		).toBe(true);
		expect(mocks.getCatalogDependencies).not.toHaveBeenCalled();
	});

	it("reads a way not known yet, keeps the read, and shows it", async () => {
		mocks.getCatalogDependents.mockResolvedValue([
			{ catalog_id: "app-1", dependency_id: "model-1" },
		]);
		const { result } = renderHook(() => useOntologyTraversals());
		await act(() => result.current.traverse(MODEL, "DOWNSTREAM", false));
		expect(mocks.getCatalogDependents).toHaveBeenCalledWith(
			"model-1",
			"MODEL",
		);
		expect(result.current.extraDependents.get("model-1")).toHaveLength(1);
		expect(
			result.current.traversals.has(
				getTraversalKey("model-1", "DOWNSTREAM"),
			),
		).toBe(true);
		expect(result.current.pendingTraversals.size).toBe(0);
	});

	it("drops a read that finishes after a reset", async () => {
		let finish: (value: unknown[]) => void = () => undefined;
		mocks.getCatalogDependents.mockReturnValue(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		const { result } = renderHook(() => useOntologyTraversals());
		let traversal: Promise<void> = Promise.resolve();
		act(() => {
			traversal = result.current.traverse(MODEL, "DOWNSTREAM", false);
		});
		await waitFor(() =>
			expect(result.current.pendingTraversals.size).toBe(1),
		);
		act(() => result.current.reset());
		await act(async () => {
			finish([{ catalog_id: "app-1", dependency_id: "model-1" }]);
			await traversal;
		});
		expect(result.current.extraDependents.size).toBe(0);
		expect(result.current.traversals.size).toBe(0);
		expect(result.current.pendingTraversals.size).toBe(0);
	});

	it("shows nothing new and says why when a read is refused", async () => {
		mocks.getCatalogDependencies.mockRejectedValue(
			new Error("You cannot view this model"),
		);
		const { result } = renderHook(() => useOntologyTraversals());
		await act(() => result.current.traverse(MODEL, "UPSTREAM", false));
		expect(result.current.traversals.size).toBe(0);
		expect(result.current.pendingTraversals.size).toBe(0);
		expect(mocks.toastError).toHaveBeenCalledWith(
			"You cannot view this model",
		);
	});
});
