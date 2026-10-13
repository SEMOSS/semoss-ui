import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { BriefHeader } from "./brief-header";

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		calendar: { data: [], checkedAt: null, isLoading: false },
		refreshSources: vi.fn(),
	}),
}));

afterEach(cleanup);

/** The headline counts only open work due today or overdue. */
function renderHeader(dues: (string | null)[] = []) {
	const state = createInitialCollaborationState();
	const item = state.items[0];
	if (!item) throw new Error("Missing sample item");
	state.threads = [];
	state.items = dues.map((due, index) => ({
		...item,
		id: `item-${index}`,
		status: "open",
		askType: "reply",
		due,
	}));
	const router = createMemoryRouter([
		{ path: "/", element: <BriefHeader /> },
	]);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
}

it("says nothing is due when the queue has no deadlines today", () => {
	renderHeader([null, new Date(Date.now() + 3 * 86_400_000).toISOString()]);
	expect(screen.getByText("Nothing is due today.")).toBeVisible();
});

it("counts overdue and due-today work, not the whole queue", () => {
	const now = Date.now();
	renderHeader([
		new Date(now - 86_400_000).toISOString(),
		new Date(now).toISOString(),
		null,
		new Date(now + 3 * 86_400_000).toISOString(),
	]);
	expect(screen.getByText("2 things are due today.")).toBeVisible();
	for (const name of [/open$/, /handled$/, /waiting on others$/]) {
		expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
	}
	expect(
		screen.getByRole("button", { name: "Check for new mail" }),
	).toBeInTheDocument();
});
