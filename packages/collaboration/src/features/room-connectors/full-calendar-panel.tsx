import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { CalendarAgendaView } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { Button, H3, Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useRoomConnectors } from "./room-connectors.context";
import type { ConnectorPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/** The main calendar shares dates with the rail and retains its chosen grid. */
export function FullCalendarPanel({ id }: WorkbenchPanelProps) {
	const { panel, host, isReady } =
		useConnectorPanel<ConnectorPanelConfig>(id);
	const { calendars, openEvent, returnToBrowser } = useRoomConnectors();
	const { t } = useTranslation("connectors");
	const { provider } = panel.config;
	const heading = useRef<HTMLHeadingElement>(null);
	const focusRequestId = panel.value?.focusRequestId;
	const isVisible = panel.isVisible;
	useEffect(() => {
		if (isReady && isVisible && focusRequestId !== undefined)
			heading.current?.focus();
	}, [isReady, isVisible, focusRequestId]);
	if (!isReady) return <Spinner className="m-4" />;
	return (
		<div className="flex size-full min-h-0 min-w-0 flex-col">
			<div className="shrink-0 px-3 pt-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => returnToBrowser("calendar", provider)}
				>
					<ArrowLeft aria-hidden="true" />
					{t("calendar.back")}
				</Button>
			</div>
			<H3
				ref={heading}
				tabIndex={-1}
				className="mx-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
			>
				{t(
					provider === "microsoft"
						? "services.outlookCalendar"
						: "services.googleCalendar",
				)}
			</H3>
			<div className="min-h-0 min-w-0 flex-1">
				<CalendarAgendaView
					{...host}
					provider={provider}
					calendar={calendars[provider]}
					presentation="calendar"
					onOpenEvent={(selection) => openEvent(provider, selection)}
				/>
			</div>
		</div>
	);
}
