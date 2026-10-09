import { act, useCallback, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
	CalendarAgendaView,
	type CalendarAgendaViewControls,
	type CalendarAgendaViewProps,
} from "./calendar-agenda-view";

const mocks = vi.hoisted(() => ({ run: vi.fn(), publish: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "calendar-insight" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({
				"services.outlook": "Outlook",
				"services.googleCalendar": "Google Calendar",
			})[key] ?? key,
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-pixel")>()),
	runConnectorPixel: mocks.run,
}));
vi.mock("../core/use-connector-saver", () => ({
	useConnectorSaver: () => ({
		saveLabel: "Save",
		isBusy: () => false,
		save: vi.fn(),
	}),
}));

let root: Root;
let container: HTMLDivElement;

/** A host retains the published controls in state, as workbench chrome does. */
function ControlHost(props: CalendarAgendaViewProps) {
	const [controls, setControls] = useState<CalendarAgendaViewControls>();
	const receiveControls = useCallback((next: CalendarAgendaViewControls) => {
		mocks.publish(next);
		setControls(next);
	}, []);
	return (
		<>
			<CalendarAgendaView {...props} onControls={receiveControls} />
			<button type="button" onClick={() => controls?.refresh()}>
				Host refresh
			</button>
			<output aria-label="Host refresh state">
				{controls?.isRefreshing ? "busy" : "ready"}
			</output>
		</>
	);
}

function currentControls(): CalendarAgendaViewControls {
	const value = mocks.publish.mock.lastCall?.[0] as
		| CalendarAgendaViewControls
		| undefined;
	if (!value) throw new Error("No published calendar controls");
	return value;
}

async function render(
	props: Partial<CalendarAgendaViewProps> = {},
): Promise<void> {
	await act(async () =>
		root.render(<ControlHost provider="microsoft" {...props} />),
	);
}

function button(label: string): HTMLButtonElement {
	const element = Array.from(container.querySelectorAll("button")).find(
		(candidate) =>
			candidate.textContent === label ||
			candidate.getAttribute("aria-label") === label,
	);
	if (!element) throw new Error(`Button missing: ${label}`);
	return element;
}

async function click(label: string): Promise<void> {
	await act(async () => button(label).click());
}

function deferred() {
	let resolve: (result: unknown) => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<unknown>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}

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
	mocks.publish.mockReset();
	mocks.run.mockReset().mockResolvedValue({ events: [], hasMore: false });
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it.each([
	["microsoft", "Outlook", "https://outlook.office.com/calendar/"],
	["google", "Google Calendar", "https://calendar.google.com/calendar/"],
] as const)(
	"publishes %s calendar metadata without feeding host rerenders back into itself",
	async (provider, appName, calendarUrl) => {
		await render({ provider });
		expect(currentControls()).toMatchObject({
			provider,
			appName,
			calendarUrl,
			isRefreshing: false,
		});
		const controls = currentControls();
		const publications = mocks.publish.mock.calls.length;
		const reads = mocks.run.mock.calls.length;
		await render({ provider, showHeader: false });
		expect(mocks.publish).toHaveBeenCalledTimes(publications);
		expect(mocks.run).toHaveBeenCalledTimes(reads);
		expect(currentControls().refresh).toBe(controls.refresh);
	},
);

it("publishes loading and manual-refresh states and clears busy after failure", async () => {
	const initial = deferred();
	mocks.run.mockReturnValueOnce(initial.promise);
	await render();
	expect(currentControls().isRefreshing).toBe(true);
	const refresh = currentControls().refresh;
	await act(async () => initial.resolve({ events: [], hasMore: false }));
	expect(currentControls().isRefreshing).toBe(false);
	const reload = deferred();
	mocks.run.mockReturnValueOnce(reload.promise);
	await click("Host refresh");
	expect(currentControls().isRefreshing).toBe(true);
	expect(currentControls().refresh).toBe(refresh);
	await act(async () => reload.reject(new Error("Calendar unavailable")));
	expect(currentControls().isRefreshing).toBe(false);
	expect(button("common.retry")).toBeTruthy();
	await click("Host refresh");
	expect(currentControls().isRefreshing).toBe(false);
	expect(currentControls().refresh).toBe(refresh);
});

it("refreshes the current date range and retains the selected agenda presentation", async () => {
	await render();
	const firstRead = mocks.run.mock.lastCall?.[0];
	const refresh = currentControls().refresh;
	await click("calendar.nextView.week");
	const nextRangeRead = mocks.run.mock.lastCall?.[0];
	expect(nextRangeRead).not.toBe(firstRead);
	expect(nextRangeRead).toContain("MicrosoftCalendarListEvents");
	expect(nextRangeRead).toContain("limit=[100]");
	await click("calendar.listView");
	expect(container.querySelector("[data-calendar-timeline]")).toBeNull();
	const reads = mocks.run.mock.calls.length;
	await act(async () => refresh());
	expect(mocks.run).toHaveBeenCalledTimes(reads + 1);
	expect(mocks.run.mock.lastCall).toEqual([
		nextRangeRead,
		"calendar-insight",
	]);
	expect(currentControls().refresh).toBe(refresh);
	expect(button("calendar.calendarView")).toBeTruthy();
	expect(container.querySelector("[data-calendar-timeline]")).toBeNull();
});

it.each([
	["full", true],
	["full", false],
	["compact", false],
] as const)(
	"keeps inline Refresh by default in %s with header=%s and hides only that action on request",
	async (presentation, showHeader) => {
		const onOpenCalendar = vi.fn();
		const props = {
			presentation,
			showHeader,
			onOpenCalendar,
			providerControl: <button type="button">Microsoft 365</button>,
		};
		await render(props);
		expect(button("common.refresh")).toBeTruthy();
		await render({ ...props, showRefresh: false });
		expect(
			container.querySelector('button[aria-label="common.refresh"]'),
		).toBeNull();
		expect(button("calendar.today")).toBeTruthy();
		expect(button("calendar.nextView.week")).toBeTruthy();
		if (presentation === "compact") {
			expect(button("Microsoft 365")).toBeTruthy();
			await click("calendar.openCalendar");
			expect(onOpenCalendar).toHaveBeenCalledOnce();
		} else {
			expect(
				container.querySelector("[data-calendar-timeline]"),
			).toBeTruthy();
		}
		const reads = mocks.run.mock.calls.length;
		await click("Host refresh");
		expect(mocks.run).toHaveBeenCalledTimes(reads + 1);
		await render(props);
		expect(button("common.refresh")).toBeTruthy();
	},
);
