import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { Activity, useState } from "react";
import type {
	CalendarAgendaViewProps,
	CalendarEventDetailViewProps,
	CalendarEventSelection,
	MailboxViewProps,
	MailDetailViewProps,
	MailItemSelection,
} from "@semoss/connectors";
import {
	createWorkbenchStore,
	useWorkbench,
	WorkbenchProvider,
} from "@semoss/workbench";
import {
	CALENDAR_EVENT_PANEL_TYPE,
	CALENDAR_FULL_PANEL_TYPE,
	CALENDAR_PANEL_TYPE,
	createToolWorkbenchLayout,
	EMAIL_DETAIL_PANEL_TYPE,
	EMAILS_PANEL_TYPE,
} from "@/features/tools/tool-workbench.constants";
import {
	WORKBENCH_CALENDAR_PANEL,
	WorkbenchCalendarPanel,
} from "./workbench-calendar-panel";
import {
	WORKBENCH_CALENDAR_EVENT_PANEL,
	WORKBENCH_CALENDAR_FULL_PANEL,
	WORKBENCH_EMAIL_DETAIL_PANEL,
	WorkbenchConnectorDetailPanel,
} from "./workbench-connector-detail-panel";
import {
	useWorkbenchConnectorNavigation,
	type WorkbenchConnectorNavigation,
} from "./workbench-connector-navigation.context";
import { WorkbenchConnectorNavigationProvider } from "./workbench-connector-navigation-provider";
import {
	WORKBENCH_EMAILS_PANEL,
	WorkbenchEmailsPanel,
} from "./workbench-emails-panel";

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({ store }),
}));
vi.mock("./workbench-connector.context", () => ({
	useWorkbenchConnectorHost: () => ({}),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/connectors", async (original) => ({
	...(await original<typeof import("@semoss/connectors")>()),
	MailboxView: MailBrowserFixture,
	MailDetailView: MailDetailFixture,
	CalendarAgendaView: CalendarBrowserFixture,
	CalendarEventDetailView: CalendarDetailFixture,
}));

const mail: MailItemSelection = {
	kind: "thread",
	id: "one",
	title: "Project update",
	itemKey: "conversation:one",
	folderName: "Inbox",
	summary: {
		key: "conversation:one",
		conversationId: "one",
		isUnread: true,
		hasAttachments: false,
		messages: [],
		latest: {
			id: "message-one",
			to: [],
			cc: [],
			attachments: [],
			isUnread: true,
			hasAttachments: false,
			isBodyTruncated: false,
		},
	},
};
const event: CalendarEventSelection = {
	itemKey: "2026-10-08:meeting",
	event: {
		id: "meeting",
		subject: "Design review",
		isAllDay: false,
		attendees: [],
		isOnlineMeeting: false,
		isCancelled: false,
		isRecurring: false,
		isBodyTruncated: false,
	},
};

/** Keep a real account subtree and row focus target without remote reads. */
function MailBrowserFixture({
	provider,
	providerControl,
	onOpenItem,
}: MailboxViewProps) {
	return (
		<div>
			{providerControl}
			<button
				type="button"
				data-item-key={mail.itemKey}
				onClick={() => onOpenItem?.(mail)}
			>
				Open {provider} mail
			</button>
		</div>
	);
}

/** The reader's heading and local state exercise reopen focus and retention. */
function MailDetailFixture({
	provider,
	selection,
	onBack,
}: MailDetailViewProps) {
	const [notes, setNotes] = useState("");
	return (
		<div>
			<h2 tabIndex={-1}>
				{provider} {selection.title}
			</h2>
			<input
				aria-label="Detail notes"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>
			<button type="button" onClick={onBack}>
				Back to emails
			</button>
		</div>
	);
}

/** Expose the supplied date window so rail/full sharing is observable. */
function CalendarBrowserFixture({
	providerControl,
	provider,
	calendar,
	presentation,
	onOpenEvent,
	onOpenCalendar,
	onBack,
}: CalendarAgendaViewProps) {
	return (
		<div>
			{providerControl}
			<output aria-label={`${presentation ?? "full"} ${provider} date`}>
				{calendar?.selectedDay.toISOString()}
			</output>
			<button
				type="button"
				data-item-key={event.itemKey}
				onClick={() => onOpenEvent?.(event)}
			>
				Open {provider} event
			</button>
			{onOpenCalendar ? (
				<button type="button" onClick={onOpenCalendar}>
					Open full calendar
				</button>
			) : null}
			{onBack ? (
				<button type="button" onClick={onBack}>
					Back to calendar
				</button>
			) : null}
		</div>
	);
}

/** Match the shared event reader's accessible heading/back contract. */
function CalendarDetailFixture({
	selection,
	onBack,
}: CalendarEventDetailViewProps) {
	return (
		<div>
			<h2 tabIndex={-1}>{selection.event.subject}</h2>
			<button type="button" onClick={onBack}>
				Back to calendar
			</button>
		</div>
	);
}

const components = {
	[EMAILS_PANEL_TYPE]: WORKBENCH_EMAILS_PANEL,
	[CALENDAR_PANEL_TYPE]: WORKBENCH_CALENDAR_PANEL,
	[EMAIL_DETAIL_PANEL_TYPE]: WORKBENCH_EMAIL_DETAIL_PANEL,
	[CALENDAR_EVENT_PANEL_TYPE]: WORKBENCH_CALENDAR_EVENT_PANEL,
	[CALENDAR_FULL_PANEL_TYPE]: WORKBENCH_CALENDAR_FULL_PANEL,
};
let store = createWorkbenchStore({ components });
let navigation: WorkbenchConnectorNavigation | null = null;

/** Capture host actions while exercising real panel contexts and Activities. */
function PanelsFixture() {
	navigation = useWorkbenchConnectorNavigation();
	const visible = useWorkbench((state) => state.layout.visiblePanelIds);
	const panels = useWorkbench((state) => state.layout.panels);
	return (
		<>
			<Activity
				mode={
					visible.includes(EMAILS_PANEL_TYPE) ? "visible" : "hidden"
				}
			>
				<WorkbenchEmailsPanel id={EMAILS_PANEL_TYPE} />
			</Activity>
			<Activity
				mode={
					visible.includes(CALENDAR_PANEL_TYPE) ? "visible" : "hidden"
				}
			>
				<WorkbenchCalendarPanel id={CALENDAR_PANEL_TYPE} />
			</Activity>
			{Object.values(panels)
				.filter((panel) =>
					[
						EMAIL_DETAIL_PANEL_TYPE,
						CALENDAR_EVENT_PANEL_TYPE,
						CALENDAR_FULL_PANEL_TYPE,
					].includes(panel.type),
				)
				.map((panel) => (
					<Activity
						key={panel.id}
						mode={visible.includes(panel.id) ? "visible" : "hidden"}
					>
						<WorkbenchConnectorDetailPanel id={panel.id} />
					</Activity>
				))}
		</>
	);
}

/** Read the current context after React commits shared date/provider updates. */
function nav(): WorkbenchConnectorNavigation {
	if (!navigation) throw new Error("Navigation is not mounted");
	return navigation;
}

/** Create one host/store boundary, as used by a chat session. */
function renderPanels(): void {
	render(
		<WorkbenchProvider store={store}>
			<WorkbenchConnectorNavigationProvider>
				<PanelsFixture />
			</WorkbenchConnectorNavigationProvider>
		</WorkbenchProvider>,
	);
}

beforeEach(() => {
	store = createWorkbenchStore({ components });
	store
		.getState()
		.layout.actions.loadSnapshot(
			createToolWorkbenchLayout("draft-insight"),
		);
	store.getState().layout.actions.selectPanel(EMAILS_PANEL_TYPE);
	navigation = null;
});

it("opens in the main stage and deduplicates only the same provider, kind, and item identity", async () => {
	renderPanels();
	await screen.findByRole("button", { name: "Open microsoft mail" });
	await act(async () => {
		nav().openMail("microsoft", mail);
		nav().openMail("microsoft", { ...mail, title: "Updated title" });
		nav().openMail("google", mail);
		nav().openMail("microsoft", { ...mail, kind: "message" });
		nav().openMail("microsoft", { ...mail, id: "two" });
	});
	const { layout } = store.getState();
	const details = Object.values(layout.panels).filter(
		(panel) => panel.type === EMAIL_DETAIL_PANEL_TYPE,
	);
	expect(details).toHaveLength(4);
	expect(details[0]?.name).toBe("Updated title");
	expect(details[0]?.helpText).toContain("Updated title");
	expect(layout.tabsets[0]?.panelIds).toEqual(
		details.map((panel) => panel.id),
	);
	expect(layout.borders.left.panelIds).not.toEqual(
		expect.arrayContaining(details.map((panel) => panel.id)),
	);
	expect(details[0]?.config).toEqual({
		provider: "microsoft",
		kind: "thread",
		itemId: "one",
	});
	expect(JSON.stringify(layout.actions.getSnapshot())).not.toContain(
		"folderName",
	);
	expect(JSON.stringify(layout.actions.getSnapshot())).not.toContain(
		"message-one",
	);
	expect(layout.values[details[0]?.id ?? ""]).toMatchObject({
		kind: "mail",
		selection: { title: "Updated title", summary: mail.summary },
	});
});

it("restores the originating provider and row without closing the retained detail, then focuses a reopened heading", async () => {
	renderPanels();
	const row = await screen.findByRole("button", {
		name: "Open microsoft mail",
	});
	fireEvent.click(row);
	const heading = await screen.findByRole("heading", {
		name: "microsoft Project update",
	});
	await waitFor(() => expect(heading).toHaveFocus());
	fireEvent.change(screen.getByRole("textbox", { name: "Detail notes" }), {
		target: { value: "Retained notes" },
	});
	act(() => nav().setProvider("emails", "google"));
	await screen.findByRole("button", { name: "Open google mail" });
	fireEvent.click(screen.getByRole("button", { name: "Back to emails" }));
	await waitFor(() => expect(row).toHaveFocus());
	expect(nav().providers.emails).toBe("microsoft");
	expect(store.getState().layout.tabsets[0]?.panelIds).toHaveLength(1);
	fireEvent.click(row);
	await waitFor(() => expect(heading).toHaveFocus());
	act(() =>
		nav().openMail("microsoft", {
			...mail,
			id: "two",
			title: "Another email",
		}),
	);
	await screen.findByRole("heading", { name: "microsoft Another email" });
	act(() => nav().openMail("microsoft", mail));
	expect(
		await screen.findByRole("textbox", { name: "Detail notes" }),
	).toHaveValue("Retained notes");
});

it("shares calendar dates by provider and reuses each full calendar while collapsing only the desktop browser", async () => {
	renderPanels();
	const initialGoogleDay = nav().calendars.google.selectedDay.getTime();
	const selected = new Date(2026, 10, 12);
	act(() => {
		nav().calendars.microsoft.selectDay(selected);
		nav().calendars.microsoft.setView("month");
		nav().returnToBrowser({ browser: "calendar", provider: "microsoft" });
	});
	expect(
		await screen.findByLabelText("compact microsoft date"),
	).toHaveTextContent(selected.toISOString());
	fireEvent.click(screen.getByRole("button", { name: "Open full calendar" }));
	expect(
		await screen.findByLabelText("full microsoft date"),
	).toHaveTextContent(selected.toISOString());
	expect(store.getState().layout.borders.left.activeId).toBeNull();
	expect(nav().calendars.microsoft.view).toBe("month");
	expect(nav().calendars.google.selectedDay.getTime()).toBe(initialGoogleDay);
	act(() => nav().openCalendar("microsoft"));
	expect(store.getState().layout.tabsets[0]?.panelIds).toHaveLength(1);
	act(() => {
		store.getState().layout.actions.setMobileLayout(true);
		nav().returnToBrowser({ browser: "calendar", provider: "google" });
	});
	await screen.findByLabelText("compact google date");
	act(() => nav().openCalendar("google"));
	expect(store.getState().layout.borders.left.activeId).toBe(
		CALENDAR_PANEL_TYPE,
	);
	expect(store.getState().layout.tabsets[0]?.panelIds).toHaveLength(2);
	expect(
		store.getState().layout.panels[
			store.getState().layout.mobileActivePanelId ?? ""
		]?.type,
	).toBe(CALENDAR_FULL_PANEL_TYPE);
});

it("deduplicates event tabs by provider and restores a grid event to its agenda row", async () => {
	renderPanels();
	act(() => {
		store.getState().layout.actions.setMobileLayout(true);
		nav().openEvent("google", {
			...event,
			itemKey: `grid:${event.itemKey}`,
		});
		nav().openEvent("google", {
			...event,
			itemKey: `grid:${event.itemKey}`,
		});
	});
	await screen.findByRole("heading", { name: "Design review" });
	expect(store.getState().layout.tabsets[0]?.panelIds).toHaveLength(1);
	fireEvent.click(screen.getByRole("button", { name: "Back to calendar" }));
	const row = await screen.findByRole("button", {
		name: "Open google event",
	});
	await waitFor(() => expect(row).toHaveFocus());
	expect(nav().providers.calendar).toBe("google");
	expect(store.getState().layout.mobileActivePanelId).toBe(
		CALENDAR_PANEL_TYPE,
	);
	act(() => nav().openEvent("microsoft", event));
	expect(store.getState().layout.tabsets[0]?.panelIds).toHaveLength(2);
});
