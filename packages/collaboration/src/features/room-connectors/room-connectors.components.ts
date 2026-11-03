import {
	CalendarDays,
	CalendarRange,
	Cloud,
	Files,
	Hash,
	type LucideIcon,
	Mail,
	MailOpen,
	MessagesSquare,
} from "lucide-react";
import { createElement } from "react";
import {
	OneDriveViewer,
	TeamsChannelViewer,
	TeamsChatViewer,
	TeamsFilesViewer,
} from "@semoss/connectors";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import { CalendarBrowserPanel } from "./calendar-browser-panel";
import { connectorViewerPanel } from "./connector-viewer-panel";
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
	ONEDRIVE_BROWSER_PANEL,
	TEAMS_CHANNELS_PANEL,
	TEAMS_CHATS_PANEL,
	TEAMS_FILES_PANEL,
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
/** A Microsoft 365 browser opened from the + menu; unlike Emails and Calendar it can be closed. */
const viewer = (
	name: string,
	icon: LucideIcon,
	content: Parameters<typeof connectorViewerPanel>[0],
): WorkbenchPanelConfig<ConnectorPanelConfig> => ({
	name,
	icon: ({ className }) =>
		createElement(icon, { className, "aria-hidden": true }),
	canDrag: false,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.provider === b.provider,
	content: connectorViewerPanel(content),
});

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
	[ONEDRIVE_BROWSER_PANEL]: viewer("OneDrive", Cloud, OneDriveViewer),
	[TEAMS_CHATS_PANEL]: viewer("Teams Chats", MessagesSquare, TeamsChatViewer),
	[TEAMS_CHANNELS_PANEL]: viewer("Teams Channels", Hash, TeamsChannelViewer),
	[TEAMS_FILES_PANEL]: viewer("Teams Files", Files, TeamsFilesViewer),
};
