import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import strings from "../../../i18n/src/resources/locales/en/connectors/connectors.json";
import { calendarViewRange } from "../core/connector-calendar";
import {
	type CalendarWindow,
	useCalendarWindow,
} from "../core/use-calendar-window";
import type { CalendarEvent } from "./calendar.types";
import {
	CalendarAgendaView,
	type CalendarAgendaViewProps,
} from "./calendar-agenda-view";
import { CalendarEventDetailView } from "./calendar-event-detail-view";
import type { CalendarEventViewProps } from "./calendar-event-view";

const { readCalendar, saveHost, renderDetail } = vi.hoisted(() => ({
	readCalendar: vi.fn(),
	saveHost: vi.fn(),
	renderDetail: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "originating-insight" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: Record<string, unknown>) => {
			const template = key
				.split(".")
				.reduce<unknown>(
					(value, field) =>
						value && typeof value === "object" && field in value
							? (value as Record<string, unknown>)[field]
							: key,
					strings,
				);
			return String(template).replace(/{{(\w+)}}/g, (_, field: string) =>
				String(values?.[field] ?? ""),
			);
		},
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: (pixel: string) => {
		readCalendar(pixel);
		return {
			data: { events: [event], hasMore: false },
			status: "ready",
			error: null,
			isRefreshing: false,
			reload: vi.fn(),
		};
	},
}));
vi.mock("../core/use-connector-saver", () => ({
	useConnectorSaver: (service: unknown, host: unknown) => {
		saveHost(service, host);
		return {
			saveLabel: "Save to Chat files",
			isBusy: () => false,
			save: vi.fn(),
		};
	},
}));
vi.mock("./calendar-event-view", () => ({
	CalendarEventView: (props: CalendarEventViewProps) => {
		renderDetail(props);
		return (
			<div data-event-detail>
				{props.summary.subject}
				<button type="button" onClick={props.onBack}>
					Return to calendar
				</button>
			</div>
		);
	},
}));

const selectedDay = new Date(2026, 9, 8);
const event: CalendarEvent = {
	id: "planning",
	subject: "Planning meeting",
	start: new Date(2026, 9, 8, 9).toISOString(),
	end: new Date(2026, 9, 8, 10).toISOString(),
	isAllDay: false,
	attendees: [],
	isOnlineMeeting: false,
	isCancelled: false,
	isRecurring: false,
	isBodyTruncated: false,
};
const calendar: CalendarWindow = {
	view: "week",
	setView: vi.fn(),
	month: new Date(2026, 9, 1),
	selectedDay,
	range: calendarViewRange(selectedDay, "week"),
	selectDay: vi.fn(),
	changeMonth: vi.fn(),
	move: vi.fn(),
	today: vi.fn(),
};
let container: HTMLDivElement;
let root: Root;

async function render(
	props: Partial<CalendarAgendaViewProps> = {},
): Promise<void> {
	await act(async () => {
		root.render(
			<CalendarAgendaView
				provider="microsoft"
				calendar={calendar}
				{...props}
			/>,
		);
	});
}

async function click(text: string, scope: Element = container): Promise<void> {
	const button = Array.from(scope.querySelectorAll("button")).find(
		(item) =>
			item.textContent === text ||
			item.getAttribute("aria-label") === text,
	);
	if (!button) throw new Error(`Missing button: ${text}`);
	await act(async () => button.click());
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("routes a compact event to its host and keeps the agenda visible", async () => {
	const onOpenEvent = vi.fn();
	const onOpenCalendar = vi.fn();
	await render({
		presentation: "compact",
		providerControl: <button type="button">Microsoft 365</button>,
		onOpenEvent,
		onOpenCalendar,
	});
	const row = container.querySelector<HTMLButtonElement>("[data-item-key]");
	if (!row) throw new Error("Missing agenda event");
	await act(async () => row.click());
	expect(onOpenEvent).toHaveBeenCalledWith({
		event,
		itemKey: "2026-10-08:planning",
	});
	expect(container.querySelector("[data-event-detail]")).toBeNull();
	expect(row.closest("[hidden], .hidden")).toBeNull();
	expect(container.textContent).toContain("Microsoft 365");
	expect(container.querySelector("[data-calendar-timeline]")).toBeNull();
	await click("Open calendar");
	expect(onOpenCalendar).toHaveBeenCalledOnce();
	await click("Next week");
	expect(calendar.move).toHaveBeenCalledWith(1);
});

it("preserves the default full calendar and inline event detail behavior", async () => {
	await render();
	expect(container.querySelector("[data-calendar-timeline]")).toBeTruthy();
	const gridEvent = container.querySelector<HTMLButtonElement>(
		'button[aria-label^="Planning meeting,"]',
	);
	if (!gridEvent) throw new Error("Missing calendar grid event");
	await act(async () => gridEvent.click());
	expect(container.querySelector("[data-event-detail]")).toBeTruthy();
	expect(
		container.querySelector("[data-calendar-timeline]")?.closest(".hidden"),
	).toBeTruthy();
	await click("Return to calendar");
	expect(container.querySelector("[data-event-detail]")).toBeNull();
	expect(
		container.querySelector("[data-calendar-timeline]")?.closest(".hidden"),
	).toBeNull();
});

/** Two presentations intentionally share one provider's navigation. */
function SharedCalendars() {
	const navigation = useCalendarWindow();
	return (
		<>
			<div data-browser>
				<CalendarAgendaView
					provider="microsoft"
					presentation="compact"
					calendar={navigation}
				/>
			</div>
			<div data-full>
				<CalendarAgendaView
					provider="microsoft"
					calendar={navigation}
				/>
			</div>
		</>
	);
}

it("shares date navigation between the retained agenda and full calendar", async () => {
	await act(async () => root.render(<SharedCalendars />));
	const browser = container.querySelector("[data-browser]");
	const full = container.querySelector("[data-full]");
	if (!browser || !full) throw new Error("Missing calendar presentations");
	const previousLabel = browser.querySelector(
		'[aria-live="polite"]',
	)?.textContent;
	await click("Next week", browser);
	const nextLabel = browser.querySelector(
		'[aria-live="polite"]',
	)?.textContent;
	expect(nextLabel).not.toBe(previousLabel);
	expect(full.querySelector('[aria-live="polite"]')?.textContent).toBe(
		nextLabel,
	);
	const recentReads = readCalendar.mock.calls.slice(-2);
	expect(recentReads[0]).toEqual(recentReads[1]);
});

it("adapts a hosted detail to its provider and originating save contract", async () => {
	const onBack = vi.fn();
	const prepareSave = vi.fn();
	const onAddToContext = vi.fn();
	const onSignIn = vi.fn();
	await act(async () => {
		root.render(
			<CalendarEventDetailView
				provider="google"
				selection={{ event, itemKey: "2026-10-08:planning" }}
				prepareSave={prepareSave}
				onAddToContext={onAddToContext}
				onSignIn={onSignIn}
				onBack={onBack}
			/>,
		);
	});
	expect(saveHost).toHaveBeenCalledWith(
		"google-calendar",
		expect.objectContaining({ prepareSave, onAddToContext }),
	);
	expect(renderDetail).toHaveBeenCalledWith(
		expect.objectContaining({
			app: expect.objectContaining({ account: "google" }),
			summary: event,
			onSignIn,
		}),
	);
	await click("Return to calendar");
	expect(onBack).toHaveBeenCalledOnce();
	expect(prepareSave).not.toHaveBeenCalled();
});
