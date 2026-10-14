import { act, render, screen, waitFor } from "@testing-library/react";
import type { CalendarEventSelection, MailSelection } from "@semoss/connectors";
import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import { WorkbenchProvider } from "@semoss/workbench";
import { ToolWorkbenchProvider } from "../tools/components/tool-workbench-provider";
import { openToolWorkbenchFiles } from "../tools/open-tool-workbench-files";
import { useToolWorkbench } from "../tools/tool-workbench.context";
import type { ToolWorkbenchContextValue } from "../tools/types/tool-workbench";
import { ConnectorPanelControls } from "./connector-panel-controls";
import { ROOM_CONNECTOR_COMPONENTS } from "./room-connectors.components";
import {
	CALENDAR_BROWSER_PANEL,
	createRoomConnectorLayout,
	EMAIL_BROWSER_PANEL,
	EVENT_DETAIL_PANEL,
	FULL_CALENDAR_PANEL,
	MAIL_DETAIL_PANEL,
} from "./room-connectors.constants";
import { useRoomConnectors } from "./room-connectors.context";
import type {
	ConnectorPanelValue,
	RoomConnectorsContextValue,
} from "./room-connectors.types";
import { RoomConnectorsProvider } from "./room-connectors-provider";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

let navigation: RoomConnectorsContextValue;
let workbench: ToolWorkbenchContextValue;

beforeEach(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	});
});

function Harness() {
	navigation = useRoomConnectors();
	workbench = useToolWorkbench();
	return null;
}

function setup(includeFiles = true) {
	return render(
		<ToolWorkbenchProvider
			roomId="room"
			insightId="origin-insight"
			components={{
				...FILE_PANEL_COMPONENTS,
				...ROOM_CONNECTOR_COMPONENTS,
			}}
			createLayout={(id) => createRoomConnectorLayout(id, includeFiles)}
			tools={{}}
			pendingApprovals={[]}
			onApproveTool={vi.fn()}
			onRejectTool={vi.fn()}
			autoReveal={false}
		>
			<RoomConnectorsProvider>
				<Harness />
			</RoomConnectorsProvider>
		</ToolWorkbenchProvider>,
	);
}

const mail: MailSelection = {
	provider: "microsoft",
	kind: "message",
	folderName: "Inbox",
	itemKey: "mail-one",
	message: {
		id: "one",
		subject: "Original subject",
		to: [],
		cc: [],
		isUnread: true,
		hasAttachments: false,
		attachments: [],
		isBodyTruncated: false,
	},
};
const event: CalendarEventSelection = {
	itemKey: "2026-10-09:event-one",
	event: {
		id: "event-one",
		subject: "Review",
		start: "2026-10-09T10:00:00Z",
		end: "2026-10-09T11:00:00Z",
		isAllDay: false,
		isCancelled: false,
		isRecurring: false,
		isOnlineMeeting: false,
		attendees: [],
		isBodyTruncated: false,
	},
};

it("starts collapsed with 300px browsers and inserts deferred Files first", () => {
	setup(false);
	let layout = workbench.store.getState().layout;
	expect(layout.borders.left).toMatchObject({
		panelIds: [EMAIL_BROWSER_PANEL, CALENDAR_BROWSER_PANEL],
		activeId: null,
		size: 300,
	});
	expect(layout.panels[EMAIL_BROWSER_PANEL]).toMatchObject({
		config: { provider: "microsoft" },
		minWidth: 300,
	});
	act(() => openToolWorkbenchFiles(workbench));
	layout = workbench.store.getState().layout;
	expect(
		layout.borders.left.panelIds.map((id) => layout.panels[id].type),
	).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		EMAIL_BROWSER_PANEL,
		CALENDAR_BROWSER_PANEL,
	]);
	expect(layout.panels[layout.borders.left.panelIds[0]]).toMatchObject({
		minWidth: 300,
	});
});

it("reuses mail tabs per provider and identity without replacing controls or original selection", () => {
	setup();
	act(() => navigation.openMail(mail));
	const id = workbench.store.getState().layout.selection.panel;
	if (!id) throw new Error("Expected a selected mail tab");
	const controls = {
		openIn: {
			href: "https://outlook.office.com/mail/id/one",
			label: "Open in Outlook",
		},
	};
	act(() =>
		workbench.store
			.getState()
			.layout.actions.setPanelValue(id, { controls, focusRequestId: 1 }),
	);
	act(() => navigation.openMail(mail));
	const layout = workbench.store.getState().layout;
	expect(
		layout.actions.findPanels((panel) => panel.type === MAIL_DETAIL_PANEL),
	).toHaveLength(1);
	expect(layout.values[id]).toEqual({ controls, focusRequestId: 2 });
	expect(layout.panels[id].config?.selection).toEqual(mail);
	act(() => navigation.openMail({ ...mail, provider: "google" }));
	expect(
		workbench.store
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === MAIL_DETAIL_PANEL,
			),
	).toHaveLength(2);
});

it("returns to the originating row without closing the detail tab", () => {
	setup();
	act(() => navigation.openMail(mail));
	const id = workbench.store.getState().layout.selection.panel;
	act(() => navigation.returnToBrowser("mail", "microsoft", mail.itemKey));
	const layout = workbench.store.getState().layout;
	expect(layout.borders.left.activeId).toBe(EMAIL_BROWSER_PANEL);
	expect(layout.values[EMAIL_BROWSER_PANEL]).toMatchObject({
		focusItem: { itemKey: mail.itemKey, requestId: 1 },
	});
	expect(id && layout.panels[id]).toBeTruthy();
});

it.each([
	["mail", EMAIL_BROWSER_PANEL],
	["calendar", CALENDAR_BROWSER_PANEL],
] as const)(
	"restores composer focus after opening the %s browser",
	async (browser, panelId) => {
		setup();
		const triggerId = `composer-actions-${crypto.randomUUID()}`;
		render(
			<>
				<button id={triggerId} type="button">
					Open composer actions
				</button>
				<button type="button">Menu action</button>
			</>,
		);
		screen.getByRole("button", { name: "Menu action" }).focus();
		act(() =>
			navigation.returnToBrowser(
				browser,
				"microsoft",
				undefined,
				triggerId,
			),
		);
		expect(workbench.isOpen).toBe(true);
		expect(workbench.store.getState().layout.borders.left.activeId).toBe(
			panelId,
		);
		act(() => workbench.closeWorkbench());
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Open composer actions" }),
			).toHaveFocus(),
		);
	},
);

it("isolates event and full-calendar identities and shares navigation for each provider", () => {
	setup();
	act(() => navigation.openEvent("microsoft", event));
	act(() => navigation.openEvent("microsoft", event));
	act(() => navigation.openEvent("google", event));
	expect(
		workbench.store
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === EVENT_DETAIL_PANEL,
			),
	).toHaveLength(2);
	act(() => navigation.returnToBrowser("calendar", "microsoft"));
	act(() => navigation.openCalendar("microsoft"));
	act(() => navigation.openCalendar("microsoft"));
	expect(workbench.store.getState().layout.borders.left.activeId).toBeNull();
	expect(
		workbench.store
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === FULL_CALENDAR_PANEL,
			),
	).toHaveLength(1);
	const originalGoogleDate = navigation.calendars.google.selectedDay;
	act(() => navigation.calendars.microsoft.selectDay(new Date(2026, 9, 20)));
	expect(navigation.calendars.microsoft.selectedDay.getDate()).toBe(20);
	expect(navigation.calendars.google.selectedDay).toBe(originalGoogleDate);
	act(() => navigation.returnToBrowser("calendar", "microsoft"));
	expect(
		workbench.store.getState().layout.values[CALENDAR_BROWSER_PANEL],
	).toMatchObject({ focusItem: { itemKey: "", requestId: 2 } });
	expect(
		workbench.store
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === FULL_CALENDAR_PANEL,
			),
	).toHaveLength(1);
});

it("opens the retained calendar from its header control without an external link", () => {
	setup();
	act(() => navigation.returnToBrowser("calendar", "microsoft"));
	act(() =>
		workbench.store
			.getState()
			.layout.actions.setPanelValue(CALENDAR_BROWSER_PANEL, {
				controls: {
					onOpenCalendar: () => navigation.openCalendar("microsoft"),
				},
			}),
	);
	render(
		<WorkbenchProvider store={workbench.store}>
			<ConnectorPanelControls id={CALENDAR_BROWSER_PANEL} />
		</WorkbenchProvider>,
	);
	const button = screen.getByRole("button", {
		name: "calendar.openCalendar",
	});
	act(() => button.click());
	act(() => button.click());
	const layout = workbench.store.getState().layout;
	const calendars = layout.actions.findPanels(
		(panel) => panel.type === FULL_CALENDAR_PANEL,
	);
	expect(calendars).toHaveLength(1);
	expect(calendars[0].config).toEqual({ provider: "microsoft" });
	expect(layout.selection.panel).toBe(calendars[0].id);
	expect(layout.borders.left.activeId).toBeNull();
	expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("renders the current detail actions in the header and disables Add to Context while saving", () => {
	setup();
	act(() => navigation.openMail(mail));
	const id = workbench.store.getState().layout.selection.panel;
	if (!id) throw new Error("Expected a selected mail tab");
	const onAddToContext = vi.fn();
	const value: ConnectorPanelValue = {
		controls: {
			addToContext: { onAddToContext, isBusy: false },
			openIn: {
				href: "https://outlook.office.com/mail/id/one",
				label: "Open in Outlook",
			},
		},
	};
	act(() =>
		workbench.store.getState().layout.actions.setPanelValue(id, value),
	);
	render(
		<WorkbenchProvider store={workbench.store}>
			<ConnectorPanelControls id={id} />
		</WorkbenchProvider>,
	);
	const link = screen.getByRole("link", { name: "Open in Outlook" });
	expect(link).toHaveAttribute("href", value.controls?.openIn?.href);
	expect(link).toHaveAttribute("target", "_blank");
	expect(link).toHaveAttribute("rel", "noopener noreferrer");
	const addButton = screen.getByRole("button", {
		name: "actions.addToContext",
	});
	act(() => addButton.click());
	expect(onAddToContext).toHaveBeenCalledTimes(1);
	act(() =>
		workbench.store.getState().layout.actions.setPanelValue(id, {
			controls: {
				...value.controls,
				addToContext: { onAddToContext, isBusy: true },
			},
		}),
	);
	expect(addButton).toBeDisabled();
	expect(addButton).toHaveAttribute("aria-busy", "true");
	act(() => addButton.click());
	expect(onAddToContext).toHaveBeenCalledTimes(1);
	act(() =>
		workbench.store
			.getState()
			.layout.actions.setPanelValue(id, { controls: {} }),
	);
	expect(screen.queryByRole("link")).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: "actions.addToContext" }),
	).not.toBeInTheDocument();
});
