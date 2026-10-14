import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import strings from "../../../i18n/src/resources/locales/en/connectors/connectors.json";
import { calendarViewRange } from "../core/connector-calendar";
import type { CalendarWindow } from "../core/use-calendar-window";
import { ConnectorCalendar } from "./connector-calendar";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: Record<string, unknown>) => {
			const template = key
				.split(".")
				.reduce<unknown>(
					(value, field) =>
						value && typeof value === "object" && field in value
							? (value as Record<string, unknown>)[field]
							: undefined,
					strings,
				);
			const text =
				typeof template === "string"
					? template
					: key === "calendar.eventCount"
						? "{{count}} events"
						: key === "calendar.openCalendar"
							? "Open calendar"
							: key;
			return text.replace(/{{(\w+)}}/g, (_, field: string) =>
				String(values?.[field] ?? ""),
			);
		},
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));

let container: HTMLDivElement;
let root: Root;
const changeMonth = vi.fn();
const selectDay = vi.fn();
const today = vi.fn();
const move = vi.fn();
const setView = vi.fn();
const onOpenEvent = vi.fn();
const calendar: CalendarWindow = {
	view: "month",
	setView,
	move,
	month: new Date(2026, 8, 1),
	selectedDay: new Date(2026, 8, 30),
	range: calendarViewRange(new Date(2026, 8, 30), "month"),
	changeMonth,
	selectDay,
	today,
};
const query = {
	status: "ready" as const,
	data: [
		{ day: new Date(2026, 8, 30), events: ["Planning", "Review", "Demo"] },
	],
	error: null,
	isRefreshing: false,
	reload: vi.fn(),
};
const render = async (
	props: Partial<Parameters<typeof ConnectorCalendar<string>>[0]> = {},
) => {
	await act(async () => {
		root.render(
			<ConnectorCalendar
				calendar={calendar}
				query={query}
				serviceName="Outlook"
				getTitle={(event) => event}
				getEventKey={(event) => event}
				onOpenEvent={onOpenEvent}
				renderEvent={(event) => (
					<li key={event}>
						<button type="button">Open {event}</button>
					</li>
				)}
				{...props}
			/>,
		);
	});
};
const click = async (label: string) => {
	const button = Array.from(container.querySelectorAll("button")).find(
		(entry) =>
			entry.getAttribute("aria-label") === label ||
			entry.textContent === label,
	);
	expect(button, label).toBeTruthy();
	await act(async () => {
		button?.click();
	});
};
beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	vi.clearAllMocks();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("renders a complete month with event previews and a selected-day agenda", async () => {
	await render();
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(42);
	expect(container.textContent).toContain("+1 more");
	expect(container.textContent).toContain("Open Demo");
	expect(
		container
			.querySelector('[data-day="9/30/2026"]')
			?.getAttribute("aria-label"),
	).toContain("3 events");
	expect(container.querySelectorAll("th")[0]?.textContent).toBe("Sun");
});
it("selects dates and navigates months without executing event actions", async () => {
	await render();
	const button = container.querySelector<HTMLButtonElement>(
		'[data-day="9/15/2026"]',
	);
	await act(async () => button?.click());
	expect(selectDay).toHaveBeenCalledWith(
		new Date(2026, 8, 15),
		expect.anything(),
		expect.anything(),
		expect.anything(),
	);
	await click("Next month");
	expect(move).toHaveBeenLastCalledWith(1);
	await click("Previous month");
	expect(move).toHaveBeenLastCalledWith(-1);
	await click("Today");
	expect(today).toHaveBeenCalledOnce();
});
it("switches between List View and Calendar View without losing its selected date", async () => {
	await render();
	await click("List View");
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(0);
	expect(container.textContent).toContain("Open Planning");
	expect(
		container.querySelector('button[aria-expanded="false"]'),
	).toBeTruthy();
	await click("Calendar View");
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(42);
	expect(container.textContent).toContain("Open Planning");
	expect(move).not.toHaveBeenCalled();
});
it("retains the grid for an empty calendar and marks partial results explicitly", async () => {
	await render({
		query: { ...query, data: [] },
		limitNote: "Only the first 100 events are shown.",
	});
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(42);
	expect(container.textContent).toContain("No loaded events for this day");
	expect(container.textContent).toContain("Only the first 100 events");
});
it("shows failed reads as errors with retry instead of an empty calendar", async () => {
	await render({
		query: {
			...query,
			status: "error",
			data: null,
			error: { kind: "other", message: "Connection failed" },
		},
	});
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(0);
	expect(container.textContent).toContain("Could not load Outlook");
	await click("Try Again");
	expect(query.reload).toHaveBeenCalledOnce();
});

it("keeps date navigation mounted while a new month loads", async () => {
	await render();
	const day = container.querySelector<HTMLButtonElement>(
		'button[data-day="9/30/2026"]',
	);
	await act(async () => day?.focus());
	await render({ query: { ...query, status: "loading", data: null } });
	expect(document.activeElement).toBe(day);
	expect(container.textContent).not.toContain("No events on this day");
});

it.each(["week", "day", "threeDays"] as const)(
	"renders %s with timed columns and opens its event",
	async (view) => {
		await render({
			calendar: {
				...calendar,
				view,
				range: calendarViewRange(calendar.selectedDay, view),
			},
			getSchedule: () => ({
				start: new Date(2026, 8, 30, 9),
				end: new Date(2026, 8, 30, 10),
				isAllDay: false,
			}),
		});
		expect(
			container.querySelectorAll("[data-calendar-timeline] section"),
		).toHaveLength(view === "week" ? 7 : view === "day" ? 1 : 3);
		await click("Planning");
		expect(onOpenEvent).toHaveBeenCalledWith(
			"Planning",
			"grid:2026-09-30:Planning",
		);
		await click("List View");
		expect(container.querySelector("[data-calendar-timeline]")).toBeNull();
		expect(container.textContent).toContain("Open Planning");
	},
);

it("keeps a rail agenda with date navigation and a separate Open calendar action", async () => {
	const onOpenCalendar = vi.fn();
	await render({ presentation: "agenda", onOpenCalendar });
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(0);
	expect(container.querySelector("[role='combobox']")).toBeNull();
	expect(container.textContent).toContain("Open Planning");
	expect(container.textContent).not.toContain("List View");
	await click("Open calendar");
	expect(onOpenCalendar).toHaveBeenCalledOnce();
	await click("Today");
	expect(today).toHaveBeenCalledOnce();
});

it("uses the full calendar's container width and restores its chosen grid when widened", async () => {
	let width = 639;
	let resize: (() => void) | undefined;
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
		() => new DOMRect(0, 0, width, 500),
	);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: () => void) {
				resize = callback;
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	await render({ presentation: "calendar" });
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(0);
	expect(container.textContent).toContain("Open Planning");
	expect(container.textContent).not.toContain("Calendar View");
	width = 640;
	await act(async () => resize?.());
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(42);
	expect(setView).not.toHaveBeenCalled();
	await click("List View");
	width = 300;
	await act(async () => resize?.());
	width = 900;
	await act(async () => resize?.());
	expect(container.querySelectorAll("button[data-day]")).toHaveLength(0);
	expect(container.textContent).toContain("Calendar View");
});
