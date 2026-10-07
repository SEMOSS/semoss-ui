import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { StrictMode, useState } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import {
	readThreadActionRequest,
	type ThreadActionRequest,
} from "./thread-action-request";
import { useThreadActionRequest } from "./use-thread-action-request";
import { WorkComposerSession } from "./work-composer-session";

function Fixture({
	ready,
	composer,
	onAction,
}: {
	ready: boolean;
	composer: WorkComposerSession;
	onAction: (request: ThreadActionRequest) => void;
}) {
	useThreadActionRequest("one", composer, ready, onAction);
	return <p>Thread</p>;
}

it("waits for context, consumes once under StrictMode, and never replays history", async () => {
	const composer = new WorkComposerSession();
	const onAction = vi.fn();
	const request = {
		id: "request",
		threadId: "one",
		action: "draft",
		sourceMessageId: "mail-2",
	};
	function LoadingFixture() {
		const [ready, setReady] = useState(false);
		return (
			<>
				<button type="button" onClick={() => setReady(true)}>
					Finish loading
				</button>
				<Fixture
					ready={ready}
					composer={composer}
					onAction={onAction}
				/>
			</>
		);
	}
	const router = createMemoryRouter(
		[{ path: "*", element: <LoadingFixture /> }],
		{
			initialEntries: [
				{
					pathname: "/work/thread/one",
					state: { threadAction: request, retained: "value" },
				},
			],
		},
	);
	const view = render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
	expect(onAction).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Finish loading" }));
	await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
	expect(onAction).toHaveBeenCalledWith(request);
	expect(router.state.location.state).toEqual({ retained: "value" });
	await act(() =>
		router.navigate("/work/thread/one", {
			state: { threadAction: request },
		}),
	);
	expect(onAction).toHaveBeenCalledTimes(1);
	view.unmount();
});

it.each([
	{ threadAction: { id: "request", threadId: "two", action: "draft" } },
	{ threadAction: { id: "", threadId: "one", action: "draft" } },
	{ threadAction: { id: "request", threadId: "one", action: "send" } },
	{
		threadAction: {
			id: "request",
			threadId: "one",
			action: "draft",
			sourceMessageId: 4,
		},
	},
])("rejects wrong-thread and malformed action requests", (state) => {
	expect(readThreadActionRequest(state, "one")).toBeUndefined();
});

it("allows manual message actions when the source is ready and the assistant is unavailable", async () => {
	const composer = new WorkComposerSession();
	const onAction = vi.fn();
	function ManualFixture() {
		useThreadActionRequest("one", composer, true, onAction, false);
		return <p>Assistant unavailable</p>;
	}
	const request = {
		id: "manual",
		threadId: "one",
		action: "reply",
		sourceMessageId: "mail-2",
	};
	const router = createMemoryRouter(
		[{ path: "*", element: <ManualFixture /> }],
		{
			initialEntries: [
				{
					pathname: "/work/thread/one",
					state: { threadAction: request },
				},
			],
		},
	);
	render(<RouterProvider router={router} />);
	await waitFor(() => expect(onAction).toHaveBeenCalledWith(request));
	await act(() =>
		router.navigate("/work/thread/one", {
			state: {
				threadAction: { ...request, id: "draft", action: "draft" },
			},
		}),
	);
	expect(onAction).toHaveBeenCalledTimes(1);
	expect(router.state.location.state.threadAction.id).toBe("draft");
});
