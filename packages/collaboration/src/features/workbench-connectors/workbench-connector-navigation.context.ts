import { createContext, useContext } from "react";
import type {
	CalendarEventSelection,
	CalendarWindow,
	ConnectorAccount,
	MailDetailViewControls,
	MailItemSelection,
} from "@semoss/connectors";

export type WorkbenchConnectorBrowser = "emails" | "calendar";

/** Only stable item identity belongs in the workbench snapshot. */
export interface WorkbenchConnectorItemConfig {
	provider: ConnectorAccount;
	kind: "thread" | "message" | "event" | "calendar";
	itemId?: string;
}

/** List summaries are session-only data and never enter the dock snapshot. */
export type WorkbenchConnectorItemValue =
	| {
			kind: "mail";
			selection: MailItemSelection;
			/** The exact opened item's URL, published by its retained reader. */
			controls?: MailDetailViewControls;
	  }
	| { kind: "event"; selection: CalendarEventSelection };

export interface WorkbenchConnectorReturnTarget {
	browser: WorkbenchConnectorBrowser;
	provider: ConnectorAccount;
	itemKey?: string;
}

export interface WorkbenchConnectorNavigation {
	providers: Record<WorkbenchConnectorBrowser, ConnectorAccount>;
	calendars: Record<ConnectorAccount, CalendarWindow>;
	returnTarget: WorkbenchConnectorReturnTarget | null;
	setProvider: (
		browser: WorkbenchConnectorBrowser,
		provider: ConnectorAccount,
	) => void;
	openMail: (
		provider: ConnectorAccount,
		selection: MailItemSelection,
	) => void;
	openEvent: (
		provider: ConnectorAccount,
		selection: CalendarEventSelection,
	) => void;
	openCalendar: (provider: ConnectorAccount) => void;
	returnToBrowser: (target: WorkbenchConnectorReturnTarget) => void;
}

export const CONNECTOR_DETAIL_FOCUS_EVENT =
	"collaboration:connector-detail-focus";

export const WorkbenchConnectorNavigationContext =
	createContext<WorkbenchConnectorNavigation | null>(null);

/** Read navigation and date state owned by this chat's connector host. */
export function useWorkbenchConnectorNavigation(): WorkbenchConnectorNavigation {
	const context = useContext(WorkbenchConnectorNavigationContext);
	if (!context) {
		throw new Error(
			"Connector navigation requires WorkbenchConnectorProvider",
		);
	}
	return context;
}
