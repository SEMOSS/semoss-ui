import { act, cleanup, render } from "@testing-library/react";
import { type ContextType, createRef, type ReactNode, type Ref } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InsightContext } from "@semoss/sdk/react";
import { Notebook, type NotebookHandle } from "./notebook";

const mocks = vi.hoisted(() => ({
	runPixelAsync: vi.fn(),
	sessionInsightId: "",
	ensure: vi.fn<() => Promise<string>>(),
}));

// the transport and the session's insight; the context stays real
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	runPixelAsync: mocks.runPixelAsync,
	console: vi.fn(async () => ({ message: [], status: "Complete" })),
	getPixelAsyncResult: vi.fn(async () => ({
		errors: [],
		results: [{ output: "ok", operationType: ["OPERATION"] }],
	})),
	useSessionInsight: () => ({
		insightId: mocks.sessionInsightId,
		ensure: mocks.ensure,
	}),
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

/** Stands in for the nearest `<InsightProvider>`. */
const Workspace = ({ children }: { children: ReactNode }) => (
	<InsightContext.Provider
		value={
			{ insightId: "workspace-insight" } as ContextType<
				typeof InsightContext
			>
		}
	>
		{children}
	</InsightContext.Provider>
);

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
		mocks.ensure.mockReset();
		mocks.ensure.mockResolvedValue("made-session-insight");
		mocks.sessionInsightId = "";
	});
	afterEach(cleanup);

	it("runs in the insight it is given first", async () => {
		const insightId = await runIn((ref) => (
			<Workspace>
				<Notebook ref={ref} content={CONTENT} insightId="given" />
			</Workspace>
		));

		expect(insightId).toBe("given");
	});

	it("runs in the nearest workspace's insight", async () => {
		mocks.sessionInsightId = "session-insight";
		const insightId = await runIn((ref) => (
			<Workspace>
				<Notebook ref={ref} content={CONTENT} />
			</Workspace>
		));

		expect(insightId).toBe("workspace-insight");
	});

	it("renders outside any workspace and runs in the session's insight", async () => {
		mocks.sessionInsightId = "session-insight";
		const insightId = await runIn((ref) => (
			<Notebook ref={ref} content={CONTENT} />
		));

		expect(insightId).toBe("session-insight");
		expect(mocks.ensure).not.toHaveBeenCalled();
	});

	it("makes the session's insight when there is none yet", async () => {
		const insightId = await runIn((ref) => (
			<Notebook ref={ref} content={CONTENT} />
		));

		expect(mocks.ensure).toHaveBeenCalledOnce();
		expect(insightId).toBe("made-session-insight");
	});
});
