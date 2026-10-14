import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "../core/connector.types";
import { useConnectorSaver } from "../core/use-connector-saver";
import type { CalendarEventSelection } from "./calendar-agenda-view";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventView } from "./calendar-event-view";

/** The host contract for a retained calendar event tab. */
export interface CalendarEventDetailViewProps extends ConnectorViewerProps {
	/** The originating account stays fixed for this detail. */
	provider: ConnectorAccount;
	/** The event and its originating row. */
	selection: CalendarEventSelection;
	/** Reveal the host's agenda without closing this detail. */
	onBack?: () => void;
	/** Increment when the host opens or reselects this detail. */
	focusRequestId?: number;
}

/** Show a single retained event with the originating insight's save actions. */
export const CalendarEventDetailView = (
	props: CalendarEventDetailViewProps,
) => {
	const {
		provider,
		selection,
		onBack,
		onSignIn,
		isVisible = true,
		onControlsChange,
		focusRequestId,
	} = props;
	const app = CALENDAR_APPS[provider];
	const saver = useConnectorSaver(app.service, props);
	return (
		<CalendarEventView
			app={app}
			summary={selection.event}
			saver={saver}
			onBack={onBack}
			onSignIn={onSignIn}
			isVisible={isVisible}
			onControlsChange={onControlsChange}
			focusRequestId={focusRequestId}
		/>
	);
};
