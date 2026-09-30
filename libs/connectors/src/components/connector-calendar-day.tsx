import { type ComponentProps, useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { CalendarDayButton } from "@semoss/ui/next";
import { calendarDayKey } from "../core/connector-calendar";
import { ConnectorCalendarContext } from "./connector-calendar.context";

/** A keyboard-accessible day with two event previews and an overflow count. */
export const ConnectorCalendarDay = (
	props: ComponentProps<typeof CalendarDayButton>,
) => {
	const { t, i18n } = useTranslation("connectors");
	const events =
		useContext(ConnectorCalendarContext).get(
			calendarDayKey(props.day.date),
		) ?? [];
	const label = props["aria-label"];
	return (
		<CalendarDayButton
			{...props}
			aria-label={
				events.length
					? `${label}, ${t("calendar.eventCount", { count: events.length })}`
					: label
			}
			className="@lg/calendar:h-24 h-16 min-w-0 items-stretch justify-start gap-0.5 overflow-hidden rounded-none px-1 py-1 text-start text-xs data-[selected-single=true]:bg-accent data-[selected-single=true]:text-accent-foreground [&>span]:opacity-100"
		>
			<span className="flex items-center justify-between gap-1">
				<span
					className={
						props.modifiers.today
							? "flex size-6 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground"
							: "flex size-6 items-center justify-center"
					}
				>
					{props.day.date.toLocaleDateString(i18n.language, {
						day: "numeric",
					})}
				</span>
				{events.length > 0 ? (
					<span
						aria-hidden
						className="@lg/calendar:hidden size-1.5 shrink-0 rounded-full bg-primary"
					/>
				) : null}
			</span>
			{events.slice(0, 2).map((title, index) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: noninteractive previews can repeat; date owns button identity
					key={index}
					aria-hidden
					className="@lg/calendar:block hidden truncate rounded-sm border-primary/50 border-s-2 bg-accent px-1 text-accent-foreground"
				>
					{title}
				</span>
			))}
			{events.length > 2 ? (
				<span
					aria-hidden
					className="@lg/calendar:block hidden truncate text-muted-foreground"
				>
					{t("calendar.moreEvents", { count: events.length - 2 })}
				</span>
			) : null}
		</CalendarDayButton>
	);
};
