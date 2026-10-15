import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import strings from "../../../i18n/src/resources/locales/en/connectors/connectors.json";
import { calendarViewRange } from "../core/connector-calendar";
import type { CalendarWindow } from "../core/use-calendar-window";
import type { ConnectorQuery } from "../core/use-connector-query";
import type { CalendarEvent, CalendarEventPage } from "./calendar.types";
import {
	CalendarAgendaView,
	type CalendarAgendaViewProps,
} from "./calendar-agenda-view";

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
			return (typeof template === "string" ? template : key).replace(
				/{{(\w+)}}/g,
				(_, field: string) => String(values?.[field] ?? ""),
			);
		},
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin-insight" }),
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: () => query,
}));
vi.mock("../core/use-connector-saver", () => ({
	useConnectorSaver: () => ({
		isBusy: () => false,
		save: vi.fn(),
		saveLabel: "Save a Copy",
	}),
}));

const event: CalendarEvent = {
	id: "event-1",
	subject: "Planning",
	start: "2026-09-30",
	end: "2026-10-01",
	isAllDay: true,
	attendees: [],
	isOnlineMeeting: false,
	isCancelled: false,
	isRecurring: false,
	isBodyTruncated: false,
};
const calendar: CalendarWindow = {
	view: "week",
	setView: vi.fn(),
	move: vi.fn(),
	month: new Date(2026, 8, 1),
	selectedDay: new Date(2026, 8, 30),
	range: calendarViewRange(new Date(2026, 8, 30), "week"),
	changeMonth: vi.fn(),
	selectDay: vi.fn(),
	today: vi.fn(),
};
const query: ConnectorQuery<CalendarEventPage> = {
	status: "ready",
	data: { events: [event], hasMore: false },
	error: null,
	isRefreshing: false,
	reload: vi.fn(),
};
let container: HTMLDivElement;
let root: Root;

/** Render a narrow host while allowing each case to exercise public viewer props. */
const render = async (props: Partial<CalendarAgendaViewProps> = {}) => {
	await act(async () =>
		root.render(
			<CalendarAgendaView
				provider="microsoft"
				calendar={calendar}
				presentation="agenda"
				showHeader={false}
				{...props}
			/>,
		),
	);
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
	query.status = "ready";
	query.data = { events: [event], hasMore: false };
	query.error = null;
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("publishes calendar controls only while visible and removes duplicate inline actions", async () => {
	const onControlsChange = vi.fn();
	const onOpenCalendar = vi.fn();
	await render({ onControlsChange, onOpenCalendar });
	expect(onControlsChange).toHaveBeenLastCalledWith({
		refresh: { onRefresh: query.reload, isRefreshing: false },
		onOpenCalendar,
		addToContext: undefined,
		openIn: undefined,
	});
	expect(container.querySelector("button[aria-label='Refresh']")).toBeNull();
	expect(container.querySelector("a[target='_blank']")).toBeNull();
	expect(container.textContent).not.toContain("Open calendar");
	await act(async () => onControlsChange.mock.lastCall?.[0].onOpenCalendar());
	expect(onOpenCalendar).toHaveBeenCalledOnce();
	await render({ onControlsChange, onOpenCalendar });
	expect(onControlsChange).toHaveBeenCalledOnce();
	onControlsChange.mockClear();
	await render({ provider: "google", isVisible: false, onControlsChange });
	expect(onControlsChange).not.toHaveBeenCalled();
	await render({ provider: "google", isVisible: true, onControlsChange });
	expect(onControlsChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			openIn: {
				href: "https://calendar.google.com/calendar/",
				label: "Open in Google Calendar",
			},
		}),
	);
});

it("keeps the internal calendar action inline when the host does not publish controls", async () => {
	const onOpenCalendar = vi.fn();
	await render({ onOpenCalendar });
	const button = Array.from(container.querySelectorAll("button")).find(
		(item) => item.textContent === "Open calendar",
	);
	expect(button).toBeDefined();
	await act(async () => button?.click());
	expect(onOpenCalendar).toHaveBeenCalledOnce();
});

it("omits the Outlook calendar control while retaining Google's native link", async () => {
	await render();
	expect(
		container.querySelector("a[aria-label='Open in Outlook']"),
	).toBeNull();
	expect(
		container.querySelector("button[aria-label='Refresh']"),
	).not.toBeNull();
	await render({ provider: "google" });
	const link = container.querySelector(
		"a[aria-label='Open in Google Calendar']",
	);
	expect(link?.getAttribute("href")).toBe(
		"https://calendar.google.com/calendar/",
	);
	expect(link?.getAttribute("target")).toBe("_blank");
	expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
	expect(
		container.querySelector("button[aria-label='Refresh']"),
	).not.toBeNull();
});

it("hands events to a retained host and restores the originating row without opening internal detail", async () => {
	const onOpenEvent = vi.fn();
	await render({ onOpenEvent });
	const row = container.querySelector<HTMLButtonElement>(
		"[data-item-key='2026-09-30:event-1']",
	);
	expect(row).not.toBeNull();
	await act(async () => row?.click());
	expect(onOpenEvent).toHaveBeenLastCalledWith({
		event,
		itemKey: "2026-09-30:event-1",
	});
	expect(
		container.querySelector("button[aria-label='Back to Calendar']"),
	).toBeNull();
	await render({
		onOpenEvent,
		focusItem: { itemKey: "2026-09-30:event-1", requestId: 1 },
	});
	expect(document.activeElement).toBe(row);
});

it("preserves Playground's default calendar toolbar when presentation props are omitted", async () => {
	await render({ presentation: undefined });
	expect(
		container.querySelector("button[aria-label='Refresh']"),
	).not.toBeNull();
	expect(container.querySelector("a[target='_blank']")).toBeNull();
	expect(container.textContent).toContain("List View");
});

it("focuses the agenda instead of another row or toolbar when the requested row disappeared", async () => {
	await render({ focusItem: { itemKey: "missing-event", requestId: 1 } });
	const agenda = container.querySelector("ul[aria-label='Agenda']");
	expect(document.activeElement).toBe(agenda);
	expect(agenda?.classList.contains("focus-visible:outline-ring")).toBe(true);
	query.data = { events: [], hasMore: false };
	await render({ focusItem: { itemKey: "", requestId: 2 } });
	expect(document.activeElement).toBe(
		container.querySelector("ul[aria-label='Agenda']"),
	);
	expect(document.activeElement?.textContent).toContain(
		"No events in this date range",
	);
});

it.each(["error", "signedOut"] as const)(
	"restores focus to a stable recovery region while %s",
	async (status) => {
		query.status = status;
		query.data = null;
		query.error = {
			kind: status === "signedOut" ? "signIn" : "other",
			message: "Fixture failure",
		};
		await render({ focusItem: { itemKey: "", requestId: 1 } });
		const region = container.querySelector(
			"section[aria-label='Outlook Calendar']",
		);
		expect(document.activeElement).toBe(region);
		expect(region?.classList.contains("focus-visible:outline-ring")).toBe(
			true,
		);
	},
);
