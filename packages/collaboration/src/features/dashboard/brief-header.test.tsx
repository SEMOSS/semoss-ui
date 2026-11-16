import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import { BriefHeader } from "./brief-header";

const dashboard = vi.hoisted(() => ({ events: [] as CalendarEvent[] }));

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		calendar: { data: dashboard.events, checkedAt: null, isLoading: false },
		refreshSources: vi.fn(),
	}),
}));

afterEach(() => {
	cleanup();
	dashboard.events = [];
	vi.useRealTimers();
});

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

it("leaves whole day events out of the next meeting, so tomorrow's holiday is not a 7 PM meeting", () => {
	// 10 AM in the sample profile's New York
	vi.useFakeTimers({
		toFake: ["Date"],
		now: new Date("2026-11-05T15:00:00Z"),
	});
	dashboard.events = [
		{
			id: "holiday",
			subject: "Holiday",
			start: "2026-11-06",
			attendees: [],
		},
		{
			id: "pto",
			subject: "Out of office",
			start: "2026-11-05",
			attendees: [],
		},
	];
	renderHeader();
	expect(screen.queryByText(/next meeting/)).not.toBeInTheDocument();
	cleanup();
	dashboard.events.push({
		id: "sync",
		subject: "Team sync",
		start: "2026-11-05T20:00:00Z",
		attendees: [],
	});
	renderHeader();
	expect(
		screen.getByText(/Your next meeting is at 3:00\sPM\.$/),
	).toBeVisible();
});

it("counts a due day saved as midnight UTC on that day, not the evening before", () => {
	// 3 PM in New York, where Nov 6's due read as an instant would be 7 PM today
	vi.useFakeTimers({
		toFake: ["Date"],
		now: new Date("2026-11-05T20:00:00Z"),
	});
	renderHeader(["2026-11-06T00:00:00Z", "2026-11-05T00:00:00Z"]);
	expect(screen.getByText("One thing is due today.")).toBeVisible();
});
