import { useState } from "react";
import { startOfLocalDay } from "./connector.format";
import {
	type CalendarView,
	calendarViewRange,
	moveCalendarDate,
} from "./connector-calendar";

/** Calendar navigation shared by providers and their read windows. */
export interface CalendarWindow {
	view: CalendarView;
	setView: (view: CalendarView) => void;
	month: Date;
	selectedDay: Date;
	range: { start: Date; end: Date };
	selectDay: (day: Date) => void;
	changeMonth: (month: Date) => void;
	move: (direction: number) => void;
	today: () => void;
}

/** Start in the current week; switching views retains the selected date. */
export const useCalendarWindow = (): CalendarWindow => {
	const [selectedDay, setSelectedDay] = useState(() =>
		startOfLocalDay(new Date()),
	);
	const [view, setView] = useState<CalendarView>("week");
	const selectDay = (day: Date) => setSelectedDay(startOfLocalDay(day));
	return {
		view,
		setView,
		selectedDay,
		month: new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1),
		range: calendarViewRange(selectedDay, view),
		selectDay,
		changeMonth: selectDay,
		move: (direction) =>
			setSelectedDay((day) => moveCalendarDate(day, view, direction)),
		today: () => selectDay(new Date()),
	};
};
