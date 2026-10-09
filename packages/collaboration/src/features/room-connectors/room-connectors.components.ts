import { CalendarDays, CalendarRange, Mail, MailOpen } from "lucide-react";
import { createElement } from "react";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import { CalendarBrowserPanel } from "./calendar-browser-panel";
import { EmailBrowserPanel } from "./email-browser-panel";
import { EventDetailPanel } from "./event-detail-panel";
import { FullCalendarPanel } from "./full-calendar-panel";
import { MailDetailPanel } from "./mail-detail-panel";
import {
	CALENDAR_BROWSER_PANEL,
	EMAIL_BROWSER_PANEL,
	EVENT_DETAIL_PANEL,
	FULL_CALENDAR_PANEL,
	MAIL_DETAIL_PANEL,
} from "./room-connectors.constants";
import type {
	ConnectorPanelConfig,
	EventPanelConfig,
	MailPanelConfig,
} from "./room-connectors.types";

const emails: WorkbenchPanelConfig<ConnectorPanelConfig> = {
	name: "Emails",
	icon: ({ className }) =>
		createElement(Mail, { className, "aria-hidden": true }),
	canClose: false,
	canDrag: false,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.provider === b.provider,
	content: EmailBrowserPanel,
};
const calendar: WorkbenchPanelConfig<ConnectorPanelConfig> = {
	name: "Calendar",
	icon: ({ className }) =>
		createElement(CalendarDays, { className, "aria-hidden": true }),
	canClose: false,
	canDrag: false,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.provider === b.provider,
	content: CalendarBrowserPanel,
};
const mail: WorkbenchPanelConfig<MailPanelConfig> = {
	name: "Email",
	icon: ({ className }) =>
		createElement(MailOpen, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) =>
		a.provider === b.provider && a.kind === b.kind && a.itemId === b.itemId,
	content: MailDetailPanel,
};
const event: WorkbenchPanelConfig<EventPanelConfig> = {
	name: "Event",
	icon: ({ className }) =>
		createElement(CalendarDays, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.provider === b.provider && a.itemId === b.itemId,
	content: EventDetailPanel,
};
const fullCalendar: WorkbenchPanelConfig<ConnectorPanelConfig> = {
	name: "Calendar",
	icon: ({ className }) =>
		createElement(CalendarRange, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.provider === b.provider,
	content: FullCalendarPanel,
};

/** Host-owned connector blueprints keep the shared workbench domain-independent. */
export const ROOM_CONNECTOR_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	[EMAIL_BROWSER_PANEL]: emails,
	[CALENDAR_BROWSER_PANEL]: calendar,
	[MAIL_DETAIL_PANEL]: mail,
	[EVENT_DETAIL_PANEL]: event,
	[FULL_CALENDAR_PANEL]: fullCalendar,
};
