import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { getMcpTools } from "@semoss/sdk";
import { useToolboxTools } from "./use-toolbox-tools";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getMcpTools: vi.fn(),
}));

const mockGetMcpTools = vi.mocked(getMcpTools);

/** A read that resolves when the test says so. */
const deferred = () => {
	let resolve: (value: unknown) => void = () => undefined;
	const promise = new Promise<unknown>((done) => {
		resolve = done;
	});
	return { promise: promise, resolve: resolve };
};

const toolsNamed = (name: string) => ({ tools: [{ name: name }] });

beforeEach(() => {
	mockGetMcpTools.mockReset();
});

test("drops the last toolbox's tools when it changes, and ignores its late read", async () => {
	const first = deferred();
	const second = deferred();
	mockGetMcpTools
		.mockReturnValueOnce(first.promise)
		.mockReturnValueOnce(second.promise);
	const { result, rerender } = renderHook(
		({ id }: { id: string }) =>
			useToolboxTools({ id: id, type: "PROJECT" }),
		{ initialProps: { id: "web" } },
	);

	act(() => result.current.load());
	rerender({ id: "mail" });
	expect(result.current.status).toBe("idle");
	expect(result.current.tools).toEqual([]);

	act(() => result.current.load());
	await act(async () => {
		first.resolve(toolsNamed("search_web"));
		await first.promise;
	});
	expect(result.current.status).toBe("loading");
	expect(result.current.tools).toEqual([]);

	await act(async () => {
		second.resolve(toolsNamed("send_mail"));
		await second.promise;
	});
	expect(result.current.status).toBe("ready");
	expect(result.current.tools.map((tool) => tool.name)).toEqual([
		"send_mail",
	]);
});
