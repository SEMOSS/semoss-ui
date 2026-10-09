import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { BriefHeader } from "./brief-header";

const refresh = vi.hoisted(() => ({
	queue: vi.fn(),
	calendar: vi.fn(),
	mail: vi.fn(),
	all: vi.fn(),
}));

vi.mock("@/features/attention/attention.context", () => ({
	useAttention: () => ({
		items: [],
		isLoading: false,
		refresh: refresh.queue,
	}),
}));

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		calendar: {
			data: [],
			checkedAt: null,
			isLoading: false,
			refresh: refresh.calendar,
		},
		mail: { checkedAt: null, isLoading: false, refresh: refresh.mail },
		refreshSources: refresh.all,
	}),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

/** Header counts use real selectors; external source snapshots remain empty. */
function renderHeader(withItems = false) {
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
			element: <BriefHeader />,
		},
		{ path: "/tasks/done", element: <h1>Handled tasks</h1> },
		{ path: "/tasks/waiting", element: <h1>Waiting tasks</h1> },
	]);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return router;
}

it.each([
	["0 handled", "/tasks/done", "Handled tasks"],
	["0 waiting on others", "/tasks/waiting", "Waiting tasks"],
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

it("counts all topics and links to the corresponding global task lists", () => {
	renderHeader(true);
	expect(screen.getByRole("link", { name: "1 handled" })).toHaveAttribute(
		"href",
		"/tasks/done",
	);
	expect(
		screen.getByRole("link", { name: "1 waiting on others" }),
	).toHaveAttribute("href", "/tasks/waiting");
	expect(
		screen.queryByRole("combobox", { name: "Topic scope" }),
	).not.toBeInTheDocument();
});

it("refreshes the shared queue and each brief source once", async () => {
	const user = userEvent.setup();
	renderHeader();
	await user.click(
		screen.getByRole("button", { name: "Refresh your brief" }),
	);
	expect(refresh.queue).toHaveBeenCalledOnce();
	expect(refresh.calendar).toHaveBeenCalledOnce();
	expect(refresh.mail).toHaveBeenCalledOnce();
	expect(refresh.all).not.toHaveBeenCalled();
});
