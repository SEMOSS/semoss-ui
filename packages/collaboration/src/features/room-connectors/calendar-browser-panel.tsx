import { useCallback } from "react";
import { CalendarAgendaView } from "@semoss/connectors";
import { Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useRoomConnectors } from "./room-connectors.context";
import type { ConnectorPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/** The rail always presents the selected calendar range as an agenda. */
export function CalendarBrowserPanel({ id }: WorkbenchPanelProps) {
	const { panel, host, isReady } =
		useConnectorPanel<ConnectorPanelConfig>(id);
	const { calendars, openEvent, openCalendar } = useRoomConnectors();
	const { provider } = panel.config;
	const handleOpenCalendar = useCallback(
		() => openCalendar(provider),
		[openCalendar, provider],
	);
	if (!isReady) return <Spinner className="m-4" />;
	return (
		<CalendarAgendaView
			{...host}
			provider={provider}
			calendar={calendars[provider]}
			presentation="agenda"
			onOpenCalendar={handleOpenCalendar}
			onOpenEvent={(selection) => openEvent(provider, selection)}
			focusItem={panel.value?.focusItem}
		/>
	);
}
