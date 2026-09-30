import { useTranslation } from "@semoss/i18n";
import { Calendar } from "@semoss/ui/next";
import { formatDayHeading } from "../core/connector.format";
import type { CalendarWindow } from "../core/use-calendar-window";
import { ConnectorCalendarContext } from "./connector-calendar.context";
import { ConnectorCalendarDay } from "./connector-calendar-day";

/** Sunday-first month grid; selecting a date shows its agenda. */
export const ConnectorCalendarMonth = ({
	calendar,
	titles,
}: {
	calendar: CalendarWindow;
	titles: ReadonlyMap<string, string[]>;
}) => {
	const { i18n } = useTranslation("connectors");
	const monthLabel = calendar.month.toLocaleDateString(i18n.language, {
		month: "long",
		year: "numeric",
	});
	return (
		<ConnectorCalendarContext value={titles}>
			<Calendar
				mode="single"
				required
				fixedWeeks
				weekStartsOn={0}
				hideNavigation
				month={calendar.month}
				selected={calendar.selectedDay}
				onMonthChange={calendar.changeMonth}
				onSelect={calendar.selectDay}
				dir={i18n.dir()}
				className="w-full p-0 [--cell-size:--spacing(8)]"
				classNames={{
					month: "flex w-full flex-col gap-0",
					months: "relative flex w-full",
					month_caption: "sr-only",
					month_grid: "w-full table-fixed border-collapse",
					weekdays: "flex border-border border-b bg-muted/20 py-1",
					weekday:
						"min-w-0 flex-1 text-center text-muted-foreground text-xs",
					week: "flex w-full",
					day: "relative min-w-0 flex-1 border-border border-e border-b last:border-e-0",
					today: "",
					outside: "bg-muted/20 text-muted-foreground",
				}}
				formatters={{
					formatWeekdayName: (date) =>
						date.toLocaleDateString(i18n.language, {
							weekday: "short",
						}),
					formatCaption: () => monthLabel,
				}}
				labels={{
					labelGrid: () => monthLabel,
					labelDayButton: (date) =>
						formatDayHeading(date, i18n.language),
					labelWeekday: (date) =>
						date.toLocaleDateString(i18n.language, {
							weekday: "long",
						}),
				}}
				components={{
					DayButton: ConnectorCalendarDay,
				}}
			/>
		</ConnectorCalendarContext>
	);
};
