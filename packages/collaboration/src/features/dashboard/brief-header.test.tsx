import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import { BriefHeader } from "./brief-header";

const dashboard = vi.hoisted(() => ({
	events: [] as CalendarEvent[],
	due: 0,
	// the twin each copy that waits for the owner is in
	twinUpdates: [] as { twinId: string }[],
}));

vi.mock("./use-due-today", () => ({ useDueToday: () => dashboard.due }));

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		calendar: { data: dashboard.events, checkedAt: null, isLoading: false },
		refreshSources: vi.fn(),
	}),
	useTwinUpdates: () => ({
		data: { updates: dashboard.twinUpdates, lastCheck: null },
	}),
}));

afterEach(() => {
	cleanup();
	dashboard.events = [];
	dashboard.due = 0;
	dashboard.twinUpdates = [];
	vi.useRealTimers();
});

/** The headline says the count of the work items due today, the same number the sidebar badge shows. */
function renderHeader(due = 0) {
	dashboard.due = due;
	const state = createInitialCollaborationState();
	const router = createMemoryRouter([
		{ path: "/", element: <BriefHeader /> },
	]);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
}

it("says nothing is due when no work item is due today", () => {
	renderHeader(0);
	expect(screen.getByText("Nothing is due today.")).toBeVisible();
});

it("says how many work items are due today", () => {
	renderHeader(2);
	expect(screen.getByText("2 things are due today.")).toBeVisible();
	for (const name of [/open$/, /handled$/, /waiting on others$/]) {
		expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
	}
	expect(
		screen.getByRole("button", { name: "Check for new mail" }),
	).toBeInTheDocument();
});

it("links to the copies that wait in the owner's Digital Twins, and says nothing when none do", () => {
	renderHeader();
	expect(
		screen.queryByRole("link", { name: /Digital Twin update/ }),
	).not.toBeInTheDocument();
	cleanup();
	// all in one twin: straight to its Updates
	dashboard.twinUpdates = [{ twinId: "twin-1" }, { twinId: "twin-1" }];
	renderHeader();
	expect(
		screen.getByRole("link", { name: "2 Digital Twin updates" }),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-1&in=updates");
	cleanup();
	// in several: to the twins, whose cards each say how many
	dashboard.twinUpdates = [{ twinId: "twin-1" }, { twinId: "twin-2" }];
	renderHeader();
	expect(
		screen.getByRole("link", { name: "2 Digital Twin updates" }),
	).toHaveAttribute("href", "/twins");
	cleanup();
	dashboard.twinUpdates = [{ twinId: "twin-2" }];
	renderHeader();
	expect(
		screen.getByRole("link", { name: "1 Digital Twin update" }),
	).toBeVisible();
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
