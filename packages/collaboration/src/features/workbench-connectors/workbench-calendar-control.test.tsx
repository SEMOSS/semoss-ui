import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { useCallback, useEffect, useState } from "react";
import type {
	CalendarAgendaViewControls,
	CalendarAgendaViewProps,
	ConnectorAccount,
} from "@semoss/connectors";
import { TooltipProvider } from "@semoss/ui/next";
import {
	createWorkbenchStore,
	Workbench,
	WorkbenchProvider,
	type WorkbenchSnapshot,
} from "@semoss/workbench";
import {
	CALENDAR_FULL_PANEL_TYPE,
	CALENDAR_PANEL_TYPE,
} from "@/features/tools/tool-workbench.constants";
import { WORKBENCH_CALENDAR_PANEL } from "./workbench-calendar-panel";
import { WORKBENCH_CALENDAR_FULL_PANEL } from "./workbench-connector-detail-panel";
import { WorkbenchConnectorNavigationProvider } from "./workbench-connector-navigation-provider";

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({ store }),
}));
vi.mock("./workbench-connector.context", () => ({
	useWorkbenchConnectorHost: () => ({}),
}));
vi.mock("@semoss/connectors", async (original) => ({
	...(await original<typeof import("@semoss/connectors")>()),
	CalendarAgendaView: CalendarFixture,
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { service?: string }) => {
			const labels: Record<string, string> = {
				"workbench.provider": "Provider",
				"workbench.calendar": "Calendar",
				"accounts.microsoft": "Microsoft 365",
				"accounts.google": "Google Workspace",
				"common.refresh": "Refresh",
				"common.loading": "Loading",
			};
			return key === "actions.openIn"
				? `Open in ${options?.service}`
				: (labels[key] ?? key);
		},
	}),
}));

const PANEL_ID = "calendar-instance-with-opaque-id";
const snapshot: WorkbenchSnapshot = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[PANEL_ID]: {
			id: PANEL_ID,
			type: CALENDAR_PANEL_TYPE,
			name: "Calendar",
			canClose: false,
		},
	},
	borders: { left: { panelIds: [PANEL_ID], activeId: PANEL_ID, size: 300 } },
	selectedPanelId: PANEL_ID,
};
const components = {
	[CALENDAR_PANEL_TYPE]: WORKBENCH_CALENDAR_PANEL,
	[CALENDAR_FULL_PANEL_TYPE]: WORKBENCH_CALENDAR_FULL_PANEL,
};
let store = createWorkbenchStore({ components });
let controls: Record<ConnectorAccount, CalendarAgendaViewControls>;
const publishers = new Map<
	ConnectorAccount,
	NonNullable<CalendarAgendaViewProps["onControls"]>
>();
const lastViewerProps = new Map<ConnectorAccount, CalendarAgendaViewProps>();
const refreshedDates: Array<{ provider: ConnectorAccount; date: string }> = [];

/** Expose real shared date navigation alongside local retained viewer state. */
function CalendarFixture(props: CalendarAgendaViewProps) {
	const {
		provider,
		providerControl,
		onControls,
		showRefresh = true,
		presentation = "full",
		calendar,
		onOpenCalendar,
	} = props;
	const [notes, setNotes] = useState("");
	const date = calendar?.selectedDay.toISOString().slice(0, 10) ?? "";
	const refresh = useCallback(() => {
		refreshedDates.push({ provider, date });
		controls[provider].refresh();
	}, [provider, date]);
	useEffect(() => {
		lastViewerProps.set(provider, props);
	}, [provider, props]);
	useEffect(() => {
		if (!onControls) return;
		publishers.set(provider, onControls);
		onControls({ ...controls[provider], refresh });
	}, [onControls, provider, refresh]);
	return (
		<section aria-label={`${presentation} ${provider} calendar`}>
			<div
				role="toolbar"
				aria-label={`${presentation} ${provider} calendar toolbar`}
			>
				{providerControl}
				{showRefresh ? (
					<button type="button">Viewer refresh</button>
				) : null}
			</div>
			<output aria-label={`${presentation} ${provider} date`}>
				{date}
			</output>
			<button type="button" onClick={() => calendar?.move(1)}>
				Next {presentation} {provider} week
			</button>
			<input
				aria-label={`${presentation} ${provider} notes`}
				value={notes}
				onChange={(event) => setNotes(event.target.value)}
			/>
			{onOpenCalendar ? (
				<button type="button" onClick={onOpenCalendar}>
					Open Calendar
				</button>
			) : null}
		</section>
	);
}

/** Render the production registration boundary and both workbench layouts. */
function Fixture({ layoutMode = "auto" }: { layoutMode?: "auto" | "compact" }) {
	return (
		<TooltipProvider>
			<WorkbenchProvider store={store}>
				<WorkbenchConnectorNavigationProvider>
					<Workbench snapshot={snapshot} layoutMode={layoutMode} />
				</WorkbenchConnectorNavigationProvider>
			</WorkbenchProvider>
		</TooltipProvider>
	);
}

/** Simulate a late asynchronous publication from either retained provider. */
function publish(
	provider: ConnectorAccount,
	patch: Partial<CalendarAgendaViewControls>,
): void {
	controls[provider] = { ...controls[provider], ...patch };
	const onControls = publishers.get(provider);
	if (!onControls) throw new Error(`No ${provider} publication callback`);
	act(() => onControls(controls[provider]));
}

/** Change the selected account through the actual provider selector. */
async function chooseProvider(name: string): Promise<void> {
	fireEvent.keyDown(screen.getByRole("combobox", { name: "Provider" }), {
		key: "ArrowDown",
	});
	fireEvent.click(await screen.findByRole("option", { name }));
}

beforeEach(() => {
	store = createWorkbenchStore({ components });
	publishers.clear();
	lastViewerProps.clear();
	refreshedDates.length = 0;
	controls = {
		microsoft: {
			provider: "microsoft",
			refresh: vi.fn(),
			isRefreshing: false,
			calendarUrl: "https://outlook.office.com/calendar/",
			appName: "Outlook",
		},
		google: {
			provider: "google",
			refresh: vi.fn(),
			isRefreshing: false,
			calendarUrl: "https://calendar.google.com/calendar/",
			appName: "Google Calendar",
		},
	};
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	});
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
		new DOMRect(0, 0, 1200, 800),
	);
});

afterEach(() => vi.restoreAllMocks());

it("registers native Outlook calendar actions on the actual desktop panel instance", async () => {
	render(<Fixture />);
	const refresh = await screen.findByRole("button", { name: "Refresh" });
	const link = screen.getByRole("link", { name: "Open in Outlook" });
	const header = screen
		.getByTestId("workbench-border-left")
		.querySelector("[data-border-header=left]");
	expect(header).toContainElement(refresh);
	expect(header).toContainElement(link);
	expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
	expect(
		within(
			screen.getByRole("toolbar", {
				name: "compact microsoft calendar toolbar",
			}),
		).queryByRole("button", { name: "Refresh" }),
	).toBeNull();
	expect(screen.queryByRole("button", { name: "Viewer refresh" })).toBeNull();
	expect(lastViewerProps.get("microsoft")).toMatchObject({
		presentation: "compact",
		showRefresh: false,
	});
	expect(link).toHaveAttribute(
		"href",
		"https://outlook.office.com/calendar/",
	);
	expect(link).toHaveAttribute("target", "_blank");
	expect(link).toHaveAttribute("rel", "noopener noreferrer");
	expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
	expect(store.getState().control.controls[PANEL_ID]).toBeDefined();
	expect(
		store.getState().control.controls[CALENDAR_PANEL_TYPE],
	).toBeUndefined();
	expect(store.getState().layout.values[PANEL_ID]).toMatchObject({
		controls: {
			microsoft: {
				provider: "microsoft",
				calendarUrl: controls.microsoft.calendarUrl,
			},
		},
	});
	expect(store.getState().layout.values[CALENDAR_PANEL_TYPE]).toBeUndefined();
	expect(
		JSON.stringify(store.getState().layout.actions.getSnapshot()),
	).not.toContain("calendarUrl");
	fireEvent.click(refresh);
	expect(controls.microsoft.refresh).toHaveBeenCalledOnce();
});

it("moves controls into the compact toolbar without duplicates and retains the date and viewer", async () => {
	const { rerender } = render(<Fixture />);
	const input = await screen.findByRole("textbox", {
		name: "compact microsoft notes",
	});
	fireEvent.change(input, { target: { value: "Retain this view" } });
	fireEvent.click(
		screen.getByRole("button", { name: "Next compact microsoft week" }),
	);
	const selectedDate = screen.getByLabelText(
		"compact microsoft date",
	).textContent;
	rerender(<Fixture layoutMode="compact" />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(true),
	);
	const toolbar = screen.getByRole("toolbar", {
		name: "compact microsoft calendar toolbar",
	});
	expect(
		within(toolbar).getByRole("button", { name: "Refresh" }),
	).toBeVisible();
	expect(
		within(toolbar).getByRole("link", { name: "Open in Outlook" }),
	).toBeVisible();
	expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
	expect(
		screen.getAllByRole("link", { name: "Open in Outlook" }),
	).toHaveLength(1);
	expect(screen.queryByTestId("workbench-border-left")).toBeNull();
	expect(
		screen.getByRole("textbox", { name: "compact microsoft notes" }),
	).toBe(input);
	expect(input).toHaveValue("Retain this view");
	expect(screen.getByLabelText("compact microsoft date").textContent).toBe(
		selectedDate,
	);
	expect(screen.getByRole("button", { name: "Open Calendar" })).toBeVisible();
	rerender(<Fixture />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(false),
	);
	expect(
		screen
			.getByTestId("workbench-border-left")
			.querySelector("[data-border-header=left]"),
	).toContainElement(screen.getByRole("button", { name: "Refresh" }));
	expect(
		within(
			screen.getByRole("toolbar", {
				name: "compact microsoft calendar toolbar",
			}),
		).queryByRole("button", { name: "Refresh" }),
	).toBeNull();
	expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
	expect(
		screen.getByRole("textbox", { name: "compact microsoft notes" }),
	).toBe(input);
	expect(input).toHaveValue("Retain this view");
	expect(screen.getByLabelText("compact microsoft date").textContent).toBe(
		selectedDate,
	);
});

it("keeps Google Calendar controls active after a hidden Microsoft calendar publishes late", async () => {
	render(<Fixture />);
	await screen.findByRole("link", { name: "Open in Outlook" });
	fireEvent.click(
		screen.getByRole("button", { name: "Next compact microsoft week" }),
	);
	const microsoftDate = screen.getByLabelText(
		"compact microsoft date",
	).textContent;
	await chooseProvider("Google Workspace");
	const google = await screen.findByRole("link", {
		name: "Open in Google Calendar",
	});
	expect(google).toHaveAttribute(
		"href",
		"https://calendar.google.com/calendar/",
	);
	expect(google).toHaveAttribute("target", "_blank");
	expect(google).toHaveAttribute("rel", "noopener noreferrer");
	expect(screen.getByLabelText("compact google date").textContent).not.toBe(
		microsoftDate,
	);
	publish("microsoft", { isRefreshing: true });
	expect(screen.getByRole("link", { name: "Open in Google Calendar" })).toBe(
		google,
	);
	expect(screen.queryByRole("link", { name: "Open in Outlook" })).toBeNull();
	const refresh = screen.getByRole("button", { name: "Refresh" });
	expect(refresh).toHaveAttribute("aria-busy", "false");
	expect(refresh).not.toHaveAttribute("aria-disabled", "true");
	fireEvent.click(refresh);
	expect(controls.google.refresh).toHaveBeenCalledOnce();
	expect(controls.microsoft.refresh).not.toHaveBeenCalled();
	await chooseProvider("Microsoft 365");
	expect(
		await screen.findByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute("href", "https://outlook.office.com/calendar/");
	expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute(
		"aria-busy",
		"true",
	);
	expect(screen.getByLabelText("compact microsoft date").textContent).toBe(
		microsoftDate,
	);
});

it("refreshes the latest date window, updates busy state live, and guards repeat actions", async () => {
	render(<Fixture />);
	const refresh = await screen.findByRole("button", { name: "Refresh" });
	const firstDate = screen.getByLabelText(
		"compact microsoft date",
	).textContent;
	fireEvent.click(refresh);
	fireEvent.click(
		screen.getByRole("button", { name: "Next compact microsoft week" }),
	);
	const nextDate = screen.getByLabelText(
		"compact microsoft date",
	).textContent;
	fireEvent.click(refresh);
	expect(refreshedDates).toEqual([
		{ provider: "microsoft", date: firstDate },
		{ provider: "microsoft", date: nextDate },
	]);
	act(() => refresh.focus());
	publish("microsoft", { isRefreshing: true });
	expect(screen.getByRole("button", { name: "Refresh" })).toBe(refresh);
	expect(refresh).toHaveFocus();
	expect(refresh).toHaveAttribute("aria-busy", "true");
	expect(refresh).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(refresh);
	fireEvent.click(refresh);
	expect(controls.microsoft.refresh).toHaveBeenCalledTimes(2);
	const newestRefresh = vi.fn();
	publish("microsoft", { isRefreshing: false, refresh: newestRefresh });
	expect(refresh).toHaveAttribute("aria-busy", "false");
	expect(refresh).not.toHaveAttribute("aria-disabled", "true");
	fireEvent.click(refresh);
	expect(newestRefresh).toHaveBeenCalledOnce();
});

it("preserves Open Calendar as the main-stage action and shares its selected date", async () => {
	render(<Fixture />);
	await screen.findByRole("button", { name: "Refresh" });
	fireEvent.click(
		screen.getByRole("button", { name: "Next compact microsoft week" }),
	);
	const selectedDate = screen.getByLabelText(
		"compact microsoft date",
	).textContent;
	fireEvent.click(screen.getByRole("button", { name: "Open Calendar" }));
	expect(
		await screen.findByLabelText("full microsoft date"),
	).toHaveTextContent(selectedDate ?? "");
	const panels = Object.values(store.getState().layout.panels).filter(
		(panel) => panel.type === CALENDAR_FULL_PANEL_TYPE,
	);
	expect(panels).toHaveLength(1);
	expect(panels[0]?.config).toEqual({
		provider: "microsoft",
		kind: "calendar",
	});
	expect(store.getState().layout.tabsets[0]?.panelIds).toEqual([
		panels[0]?.id,
	]);
	expect(store.getState().layout.borders.left.activeId).toBeNull();
	act(() => store.getState().layout.actions.navigatePanel(PANEL_ID));
	fireEvent.click(
		await screen.findByRole("button", { name: "Open Calendar" }),
	);
	expect(store.getState().layout.tabsets[0]?.panelIds).toEqual([
		panels[0]?.id,
	]);
});
