import type {
	CalendarEventSelection,
	CalendarWindow,
	ConnectorAccount,
	ConnectorFocusRequest,
	ConnectorViewerControls,
	MailSelection,
} from "@semoss/connectors";
import type { RoomSession } from "../rooms/room-session";

/** Immutable identity of a browser or full-calendar tab. */
export interface ConnectorPanelConfig {
	provider: ConnectorAccount;
}

/** One mail tab keeps the selection that originally opened it. */
export interface MailPanelConfig extends ConnectorPanelConfig {
	kind: MailSelection["kind"];
	itemId: string;
	selection: MailSelection;
}

/** One event tab keeps its provider and originating agenda row. */
export interface EventPanelConfig extends ConnectorPanelConfig {
	itemId: string;
	selection: CalendarEventSelection;
}

/** Runtime-only publication; never part of the workbench snapshot. */
export interface ConnectorPanelValue {
	controls?: ConnectorViewerControls;
	focusRequestId?: number;
	focusItem?: ConnectorFocusRequest;
}

/** Collaboration owns navigation and calendar state for the open chat. */
export interface RoomConnectorsContextValue {
	session?: RoomSession;
	calendars: Record<ConnectorAccount, CalendarWindow>;
	openMail: (selection: MailSelection) => void;
	openEvent: (
		provider: ConnectorAccount,
		selection: CalendarEventSelection,
	) => void;
	openCalendar: (provider: ConnectorAccount) => void;
	returnToBrowser: (
		browser: "mail" | "calendar",
		provider: ConnectorAccount,
		itemKey?: string,
		returnFocusId?: string,
	) => void;
}
