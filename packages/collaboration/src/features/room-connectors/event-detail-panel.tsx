import { CalendarEventDetailView } from "@semoss/connectors";
import { Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useRoomConnectors } from "./room-connectors.context";
import type { EventPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/** Retain an event detail separately from its agenda browser. */
export function EventDetailPanel({ id }: WorkbenchPanelProps) {
	const { panel, host, isReady } = useConnectorPanel<EventPanelConfig>(id);
	const { returnToBrowser } = useRoomConnectors();
	const { selection, provider } = panel.config;
	if (!isReady) return <Spinner className="m-4" />;
	const agendaKey = selection.itemKey.startsWith("grid:")
		? selection.itemKey.slice(5)
		: selection.itemKey;
	return (
		<CalendarEventDetailView
			{...host}
			provider={provider}
			selection={selection}
			focusRequestId={panel.value?.focusRequestId}
			onBack={() => returnToBrowser("calendar", provider, agendaKey)}
		/>
	);
}
