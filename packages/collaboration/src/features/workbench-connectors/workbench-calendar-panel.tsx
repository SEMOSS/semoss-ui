import { CalendarDays } from "lucide-react";
import { createElement, lazy, useCallback } from "react";
import type { CalendarAgendaViewControls } from "@semoss/connectors";
import {
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	WorkbenchCalendarControl,
	type WorkbenchCalendarPanelValue,
} from "./workbench-calendar-control";
import { useWorkbenchConnectorNavigation } from "./workbench-connector-navigation.context";
import { WorkbenchConnectorPanel } from "./workbench-connector-panel";

const CalendarAgendaView = lazy(() =>
	import("@semoss/connectors").then((module) => ({
		default: module.CalendarAgendaView,
	})),
);

/** The user's Microsoft and Google calendars in the chat workbench. */
export function WorkbenchCalendarPanel({ id }: WorkbenchPanelProps) {
	const { calendars, openEvent, openCalendar, providers } =
		useWorkbenchConnectorNavigation();
	const { setValue } = useWorkbenchPanel<
		Record<string, never>,
		WorkbenchCalendarPanelValue
	>(id);
	const isCompact = useWorkbench((state) => state.layout.isMobileLayout);
	const publishControls = useCallback(
		(controls: CalendarAgendaViewControls): void => {
			setValue((current) => ({
				controls: {
					...current?.controls,
					[controls.provider]: controls,
				},
			}));
		},
		[setValue],
	);
	useWorkbenchControl(id, WorkbenchCalendarControl);
	return (
		<WorkbenchConnectorPanel browser="calendar">
			{(props) => (
				<CalendarAgendaView
					{...props}
					presentation="compact"
					showRefresh={false}
					onControls={publishControls}
					providerControl={
						<div className="flex min-w-0 items-center gap-2">
							{props.providerControl}
							{isCompact &&
							props.provider === providers.calendar ? (
								<WorkbenchCalendarControl id={id} />
							) : null}
						</div>
					}
					calendar={calendars[props.provider]}
					onOpenEvent={(selection) =>
						openEvent(props.provider, selection)
					}
					onOpenCalendar={() => openCalendar(props.provider)}
				/>
			)}
		</WorkbenchConnectorPanel>
	);
}

/** A single retained calendar panel per chat. */
export const WORKBENCH_CALENDAR_PANEL = {
	name: "Calendar",
	icon: ({ className }) =>
		createElement(CalendarDays, { "aria-hidden": true, className }),
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: WorkbenchCalendarPanel,
} satisfies WorkbenchPanelConfig<
	Record<string, never>,
	WorkbenchCalendarPanelValue
>;
