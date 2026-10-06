import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { BriefHeader } from "./brief-header";

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		calendar: { data: [], checkedAt: null, isLoading: false },
		mail: { checkedAt: null, isLoading: false },
		refreshSources: vi.fn(),
	}),
}));

afterEach(cleanup);

/** Header counts use real selectors; external source snapshots remain empty. */
function renderHeader(withItems = false, topicId = "") {
	const state = createInitialCollaborationState();
	const item = state.items[0];
	if (!item) throw new Error("Missing sample item");
	state.threads = [];
	state.items = withItems
		? [
				{ ...item, id: "done", status: "done", topicIds: ["one"] },
				{
					...item,
					id: "waiting",
					status: "waiting",
					topicIds: ["two"],
				},
			]
		: [];
	const router = createMemoryRouter([
		{
			path: "/",
			element: <BriefHeader topicId={topicId} onTopicChange={vi.fn()} />,
		},
		{ path: "/work/done", element: <h1>Handled work</h1> },
		{ path: "/work/waiting", element: <h1>Waiting work</h1> },
	]);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return router;
}

it.each([
	["0 handled", "/work/done", "Handled work"],
	["0 waiting on others", "/work/waiting", "Waiting work"],
])(
	"keeps %s navigable when the queue is empty",
	async (name, path, heading) => {
		const user = userEvent.setup();
		const router = renderHeader();
		const link = screen.getByRole("link", { name });
		expect(link).toHaveAttribute("href", path);
		link.focus();
		await user.keyboard("{Enter}");
		expect(router.state.location.pathname).toBe(path);
		expect(screen.getByRole("heading", { name: heading })).toBeVisible();
	},
);

it.each([
	["", "1 handled", "1 waiting on others"],
	["one", "1 handled", "0 waiting on others"],
	["two", "0 handled", "1 waiting on others"],
])(
	"retains topic-scoped counts for %s while linking to the work lists",
	(topic, handled, waiting) => {
		renderHeader(true, topic);
		expect(screen.getByRole("link", { name: handled })).toHaveAttribute(
			"href",
			"/work/done",
		);
		expect(screen.getByRole("link", { name: waiting })).toHaveAttribute(
			"href",
			"/work/waiting",
		);
	},
);
