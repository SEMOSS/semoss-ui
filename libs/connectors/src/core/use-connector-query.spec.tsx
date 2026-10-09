import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runConnectorPixel } from "./connector-pixel";
import { type ConnectorQuery, useConnectorQuery } from "./use-connector-query";

const insight = vi.hoisted(() => ({ insightId: "first" }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("./connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("./connector-pixel")>()),
	runConnectorPixel: vi.fn(),
}));
const read = vi.mocked(runConnectorPixel);
const parse = (raw: unknown): string => String(raw);
let snapshot: ConnectorQuery<string> | undefined;
let root: Root;
const Harness = ({ pixel = "Same();" }: { pixel?: string }) => {
	snapshot = useConnectorQuery(pixel, parse, { listKey: "shared" });
	return null;
};
const current = (): ConnectorQuery<string> => {
	if (!snapshot) throw new Error("Not rendered");
	return snapshot;
};
const render = async (pixel?: string) => {
	await act(async () => root.render(<Harness pixel={pixel} />));
};
const deferred = () => {
	let resolve: (value: unknown) => void = () => undefined;
	const promise = new Promise<unknown>((onResolve) => {
		resolve = onResolve;
	});
	return { promise, resolve };
};
beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	insight.insightId = "first";
	read.mockReset();
	root = createRoot(document.createElement("div"));
});
afterEach(async () => {
	await act(async () => root.unmount());
	vi.unstubAllGlobals();
});

it("clears previously loaded data when an identical pixel moves to another insight", async () => {
	const next = deferred();
	read.mockResolvedValueOnce("first data").mockReturnValueOnce(next.promise);
	await render();
	expect(current().data).toBe("first data");
	insight.insightId = "second";
	await render();
	expect(current()).toMatchObject({
		data: null,
		status: "loading",
		isRefreshing: false,
	});
	expect(read.mock.calls[1]).toEqual(["Same();", "second"]);
	await act(async () => next.resolve("second data"));
	expect(current().data).toBe("second data");
});

it("drops a late response from the previous insight even when pixel and list keys match", async () => {
	const first = deferred();
	read.mockReturnValueOnce(first.promise).mockResolvedValueOnce(
		"second data",
	);
	await render();
	insight.insightId = "second";
	await render();
	await act(async () => first.resolve("stale first data"));
	expect(current().data).toBe("second data");
});

it("continues retaining same-list data while the pixel changes inside one insight", async () => {
	const next = deferred();
	read.mockResolvedValueOnce("first page").mockReturnValueOnce(next.promise);
	await render();
	await render("Next();");
	expect(current()).toMatchObject({
		data: "first page",
		status: "ready",
		isRefreshing: true,
	});
	await act(async () => next.resolve("next page"));
	expect(current().data).toBe("next page");
});
