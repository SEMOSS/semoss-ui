import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import { BriefDay } from "./brief-day";

const dashboard = vi.hoisted(() => ({ events: [] as CalendarEvent[] }));

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		calendar: {
			data: dashboard.events,
			isLoading: false,
			refresh: vi.fn(),
		},
		setSource: vi.fn(),
	}),
}));

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

it("lists today's whole day events first as All day, and leaves out tomorrow's", () => {
	// 10 AM in the sample profile's New York, where a date read as UTC midnight is 7 PM the day before
	vi.useFakeTimers({
		toFake: ["Date"],
		now: new Date("2026-11-05T15:00:00Z"),
	});
	dashboard.events = [
		{
			id: "sync",
			subject: "Team sync",
			start: "2026-11-05T16:00:00Z",
			attendees: [],
		},
		{
			id: "holiday",
			subject: "Holiday",
			start: "2026-11-06",
			attendees: [],
		},
		{
			id: "standup",
			subject: "Standup",
			start: "2026-11-05T13:30:00Z",
			attendees: [],
		},
		{
			id: "pto",
			subject: "Out of office",
			start: "2026-11-05",
			attendees: [],
		},
	];
	const state = createInitialCollaborationState();
	state.settings.sourcesJson.calendar = true;
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter>
				<BriefDay />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	const day = within(screen.getByRole("region", { name: "Your day" }));
	expect(day.getByText("3 meetings")).toBeVisible();
	expect(day.queryByText("Holiday")).not.toBeInTheDocument();
	const [pto, standup, next, end] = day.getAllByRole("listitem");
	expect(
		within(pto).getByRole("button", { name: "Out of office" }),
	).toBeVisible();
	expect(within(pto).getByText("All day")).toHaveAttribute(
		"datetime",
		"2026-11-05",
	);
	expect(within(standup).getByText("08:30")).toBeVisible();
	// the time marker sits before the next timed meeting, the one to prepare for
	expect(within(next).getByText("10:00")).toBeVisible();
	expect(within(next).getByText("11:00")).toBeVisible();
	expect(
		within(next).getByRole("button", { name: "Prepare for meeting" }),
	).toBeVisible();
	expect(end).toBeEmptyDOMElement();
});
