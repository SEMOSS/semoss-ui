import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorViewerControls } from "../core/connector.types";
import { saveToInsight } from "../core/connector-files";
import { parseCalendarEventDetail } from "./calendar.parsers";
import type { CalendarEvent } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import {
	CalendarEventDetailView,
	type CalendarEventDetailViewProps,
} from "./calendar-event-detail-view";
import { CalendarEventView } from "./calendar-event-view";

const mocks = vi.hoisted(() => ({
	data: undefined as CalendarEvent | undefined,
	pixels: [] as string[],
	translate: (key: string, values?: { service?: string }) =>
		values?.service ? `Open in ${values.service}` : key,
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: mocks.translate, i18n: { language: "en" } }),
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: (pixel: string) => {
		mocks.pixels.push(pixel);
		return {
			data: mocks.data,
			status: mocks.data ? "ready" : "loading",
			error: null,
			isRefreshing: false,
			reload: () => undefined,
		};
	},
}));
vi.mock("../components/connector-text-body", () => ({
	ConnectorTextBody: () => null,
}));
vi.mock("../core/connector-files", () => ({ saveToInsight: vi.fn() }));
const save = vi.mocked(saveToInsight);
const savedFile = {
	path: "event.md",
	name: "event.md",
	service: "outlook-calendar" as const,
};
const event = parseCalendarEventDetail({
	id: "event-1",
	subject: "Planning meeting",
	body: "Meeting description",
	webLink: "https://outlook.office.com/calendar/item/event-1",
	joinUrl: "https://teams.microsoft.com/join/event-1",
});
let root: Root;
let container: HTMLDivElement;
const render = async (props: Partial<CalendarEventDetailViewProps> = {}) => {
	await act(async () =>
		root.render(
			<CalendarEventDetailView
				provider="microsoft"
				selection={{ event, itemKey: "day:event-1" }}
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
	mocks.data = event;
	mocks.pixels = [];
	save.mockReset().mockResolvedValue(savedFile);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("publishes stable event controls while leaving Save and Join inline, preserving default actions", async () => {
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	const onAddToContext = vi.fn();
	const props = { onControlsChange: controls, onAddToContext };
	await render(props);
	expect(controls).toHaveBeenLastCalledWith({
		refresh: undefined,
		onOpenCalendar: undefined,
		addToContext: { onAddToContext: expect.any(Function), isBusy: false },
		openIn: { href: event.webLink, label: "Open in services.outlook" },
	});
	expect(container.textContent).not.toContain("actions.addToContext");
	expect(container.textContent).toContain("actions.save");
	expect(container.textContent).toContain("calendar.join");
	expect(container.querySelector(`a[href="${event.webLink}"]`)).toBeNull();
	expect(
		container.querySelector(`a[href="${event.joinUrl}"]`),
	).not.toBeNull();
	await render(props);
	expect(controls).toHaveBeenCalledOnce();
	await render({ onAddToContext });
	expect(container.textContent).toContain("actions.addToContext");
	expect(
		container.querySelector(`a[href="${event.webLink}"]`),
	).not.toBeNull();
});

it("publishes busy state and saves the matching event into the originating context", async () => {
	let finishSave: (file: typeof savedFile) => void = () => undefined;
	save.mockReturnValueOnce(
		new Promise((resolve) => {
			finishSave = resolve;
		}),
	);
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	const onAddToContext = vi.fn();
	await render({ onControlsChange: controls, onAddToContext });
	const action = controls.mock.lastCall?.[0].addToContext?.onAddToContext;
	await act(async () => action?.());
	expect(controls.mock.lastCall?.[0].addToContext).toEqual({
		onAddToContext: action,
		isBusy: true,
	});
	expect(save).toHaveBeenCalledWith(
		"origin",
		"outlook-calendar",
		expect.any(Object),
	);
	const source = save.mock.calls[0]?.[2];
	if (source?.kind !== "text") throw new Error("Expected an event text save");
	expect(await source.getContent()).toContain("Meeting description");
	await act(async () => finishSave(savedFile));
	expect(onAddToContext).toHaveBeenCalledWith(savedFile);
	expect(controls.mock.lastCall?.[0].addToContext?.isBusy).toBe(false);
});

it.each([
	undefined,
	"javascript:alert(1)",
	"http://example.com/event",
	"/event/1",
	"//example.com/event",
])("hides unsafe or absent event links: %s", async (webLink) => {
	mocks.data = { ...event, webLink };
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	await render({ onControlsChange: controls });
	expect(controls.mock.lastCall?.[0].openIn).toBeUndefined();
	await render();
	expect(container.querySelectorAll("a")).toHaveLength(1);
	expect(container.querySelector("a")?.getAttribute("href")).toBe(
		event.joinUrl,
	);
});

it("does not publish summary or mismatched event actions while the selected event is loading", async () => {
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	const onAddToContext = vi.fn();
	mocks.data = undefined;
	await render({ onControlsChange: controls, onAddToContext });
	expect(controls).toHaveBeenLastCalledWith({
		refresh: undefined,
		onOpenCalendar: undefined,
		addToContext: undefined,
		openIn: undefined,
	});
	mocks.data = { ...event, id: "other-event" };
	await render({ onControlsChange: controls, onAddToContext });
	expect(
		controls.mock.calls.every(
			([value]) => !value.addToContext && !value.openIn,
		),
	).toBe(true);
	expect(container.textContent).not.toContain("actions.save");
});

it("keeps hidden providers from publishing and uses the selected provider when revealed", async () => {
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	await render({
		provider: "google",
		isVisible: false,
		onControlsChange: controls,
	});
	expect(controls).not.toHaveBeenCalled();
	await render({
		provider: "google",
		isVisible: true,
		onControlsChange: controls,
	});
	expect(controls.mock.lastCall?.[0].openIn?.label).toBe(
		"Open in services.googleCalendar",
	);
	expect(
		mocks.pixels.every((pixel) => pixel.startsWith("GoogleCalendar")),
	).toBe(true);
});

it("preserves complete-summary tool details and their inline actions", async () => {
	mocks.data = undefined;
	await act(async () =>
		root.render(
			<CalendarEventView
				app={CALENDAR_APPS.microsoft}
				summary={event}
				isSummaryComplete
				saver={{
					saveLabel: "Save",
					isBusy: () => false,
					save: vi.fn(),
					addToContext: vi.fn(),
				}}
			/>,
		),
	);
	expect(container.textContent).toContain("actions.addToContext");
	expect(container.textContent).toContain("Save");
	expect(
		container.querySelector(`a[href="${event.webLink}"]`),
	).not.toBeNull();
});
