import { act, cleanup, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readThreadWorkbenchRequest } from "./thread-workbench-request";
import { useThreadWorkbenchRequest } from "./use-thread-workbench-request";

function WorkbenchRequestFixture({ onOpen }: { onOpen: () => void }) {
	const { threadId = "" } = useParams();
	useThreadWorkbenchRequest(threadId, onOpen);
	return <p>Thread</p>;
}

afterEach(cleanup);

describe("thread workbench requests", () => {
	it("opens once, preserves unrelated history state, and does not replay on Back", async () => {
		const onOpen = vi.fn();
		const router = createMemoryRouter(
			[
				{
					path: "/work/thread/:threadId",
					element: <WorkbenchRequestFixture onOpen={onOpen} />,
				},
				{ path: "/work", element: <p>Work</p> },
			],
			{
				initialEntries: [
					{
						pathname: "/work/thread/one",
						search: "?view=all",
						hash: "#message",
						state: {
							preserved: "value",
							threadWorkbench: { id: "first", threadId: "one" },
						},
					},
				],
			},
		);
		render(
			<StrictMode>
				<RouterProvider router={router} />
			</StrictMode>,
		);
		await waitFor(() =>
			expect(router.state.location.state).toEqual({ preserved: "value" }),
		);
		expect(onOpen).toHaveBeenCalledTimes(1);
		expect(router.state.location.search).toBe("?view=all");
		expect(router.state.location.hash).toBe("#message");
		await act(() => router.navigate("/work"));
		await act(() => router.navigate(-1));
		expect(onOpen).toHaveBeenCalledTimes(1);
		await act(() =>
			router.navigate("/work/thread/one", {
				replace: true,
				state: {
					threadWorkbench: { id: "second", threadId: "one" },
				},
			}),
		);
		await waitFor(() => expect(router.state.location.state).toEqual({}));
		expect(onOpen).toHaveBeenCalledTimes(2);
	});

	it.each([
		null,
		{},
		{ threadWorkbench: { id: "", threadId: "one" } },
		{ threadWorkbench: { id: 3, threadId: "one" } },
		{ threadWorkbench: { id: "other", threadId: "two" } },
	])("ignores invalid or other-thread state %j", (state) => {
		const onOpen = vi.fn();
		const router = createMemoryRouter(
			[
				{
					path: "/work/thread/:threadId",
					element: <WorkbenchRequestFixture onOpen={onOpen} />,
				},
			],
			{ initialEntries: [{ pathname: "/work/thread/one", state }] },
		);
		render(<RouterProvider router={router} />);
		expect(readThreadWorkbenchRequest(state, "one")).toBeUndefined();
		expect(onOpen).not.toHaveBeenCalled();
		expect(router.state.location.state).toEqual(state);
	});
});
