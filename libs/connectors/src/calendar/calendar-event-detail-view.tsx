import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "../core/connector.types";
import { useConnectorSaver } from "../core/use-connector-saver";
import type { CalendarEventSelection } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventView } from "./calendar-event-view";

/** Props for an event opened in its host's own work area. */
export interface CalendarEventDetailViewProps extends ConnectorViewerProps {
	/** The account the selected event belongs to. */
	provider: ConnectorAccount;
	/** The event and its originating row. */
	selection: CalendarEventSelection;
	/** Reveal the originating calendar and restore its row focus. */
	onBack?: () => void;
}

/** Reuse the event reader and save actions in a host-owned detail panel. */
export function CalendarEventDetailView(props: CalendarEventDetailViewProps) {
	const { provider, selection, onBack, onSignIn } = props;
	const app = CALENDAR_APPS[provider];
	const saver = useConnectorSaver(app.service, props);
	return (
		<CalendarEventView
			key={selection.event.id}
			app={app}
			summary={selection.event}
			saver={saver}
			onBack={onBack}
			onSignIn={onSignIn}
		/>
	);
}
