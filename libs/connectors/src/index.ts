// the apps' logos live in @semoss/shared, so every package can show them
export {
	type ConnectorBrand,
	ConnectorBrandIcon,
	type ConnectorBrandIconProps,
} from "@semoss/shared";
export type { CalendarEvent } from "./calendar/calendar.types";
export {
	CalendarAgendaView,
	type CalendarAgendaViewProps,
	type CalendarEventSelection,
} from "./calendar/calendar-agenda-view";
export {
	CalendarEventDetailView,
	type CalendarEventDetailViewProps,
} from "./calendar/calendar-event-detail-view";
export { CALENDAR_TOOL_VIEWS } from "./calendar/calendar-tool-views";
export type {
	ConnectorAccount,
	ConnectorFocusRequest,
	ConnectorSavedFile,
	ConnectorViewerControls,
	ConnectorViewerProps,
	ConnectorViewerService,
} from "./core/connector.types";
export {
	type CalendarWindow,
	useCalendarWindow,
} from "./core/use-calendar-window";
export {
	GoogleDocsViewer,
	type GoogleDocsViewerProps,
} from "./google/docs/google-docs-viewer";
export {
	GoogleDriveViewer,
	type GoogleDriveViewerProps,
} from "./google/drive/google-drive-viewer";
export type { MailMessage } from "./mail/mail.types";
export {
	MailDetailView,
	type MailDetailViewProps,
	type MailSelection,
} from "./mail/mail-detail-view";
export { MAIL_TOOL_VIEWS } from "./mail/mail-tool-views";
export {
	MailboxView,
	type MailboxViewProps,
} from "./mail/mailbox-view";
export {
	OneDriveViewer,
	type OneDriveViewerProps,
} from "./microsoft/onedrive/onedrive-viewer";
export {
	TeamsChannelViewer,
	type TeamsChannelViewerProps,
} from "./microsoft/teams/teams-channel-viewer";
export {
	TeamsChatViewer,
	type TeamsChatViewerProps,
} from "./microsoft/teams/teams-chat-viewer";
export {
	TeamsFilesViewer,
	type TeamsFilesViewerProps,
} from "./microsoft/teams/teams-files-viewer";
