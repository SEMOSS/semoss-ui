import { act, cleanup, render } from "@testing-library/react";
import { createRef, type ReactNode, type Ref } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Notebook, type NotebookHandle } from "./notebook";

const mocks = vi.hoisted(() => ({
	runPixelAsync: vi.fn(),
}));

// the transport only
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	runPixelAsync: mocks.runPixelAsync,
	console: vi.fn(async () => ({ message: [], status: "Complete" })),
	getPixelAsyncResult: vi.fn(async () => ({
		errors: [],
		results: [{ output: "ok", operationType: ["OPERATION"] }],
	})),
}));

// the worker-backed editor is not under test
vi.mock("./notebook-cell-input-code", () => ({
	NotebookCellInputCode: () => null,
}));

/** One code cell, so running the notebook sends one pixel. */
const CONTENT = JSON.stringify({
	cells: [
		{
			cell_type: "code",
			id: "cell-1",
			metadata: {},
			source: ["print(1)"],
			outputs: [],
			execution_count: null,
		},
	],
	metadata: {},
	nbformat: 4,
	nbformat_minor: 5,
});

/** Render the notebook, run every cell, and return the insight it ran in. */
const runIn = async (node: (ref: Ref<NotebookHandle>) => ReactNode) => {
	const ref = createRef<NotebookHandle>();
	render(node(ref));
	await act(async () => {
		await ref.current?.runAll();
	});
	return mocks.runPixelAsync.mock.calls[0]?.[1];
};

describe("Notebook insight", () => {
	beforeEach(() => {
		mocks.runPixelAsync.mockReset();
		mocks.runPixelAsync.mockResolvedValue({ jobId: "job-1" });
	});
	afterEach(cleanup);

	it("runs every cell in the insight it is given, with no provider", async () => {
		const insightId = await runIn((ref) => (
			<Notebook ref={ref} content={CONTENT} insightId="given" />
		));

		expect(insightId).toBe("given");
	});
});
