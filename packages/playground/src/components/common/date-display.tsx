import { useTranslation } from "@semoss/i18n";

export interface DateDisplayProps {
	date: Date;
	long?: boolean;
	smart?: boolean;
}

export const DateDisplay = ({
	date,
	long = false,
	smart = false,
}: DateDisplayProps) => {
	const { i18n } = useTranslation("common");

	const isToday = date.toDateString() === new Date().toDateString();

	const formatted = new Intl.DateTimeFormat(i18n.language, {
		month: smart && isToday ? undefined : long ? "long" : "short",
		day: smart && isToday ? undefined : "numeric",
		year: smart && isToday ? undefined : "numeric",
		hour: smart && !isToday ? undefined : "numeric",
		minute: smart && !isToday ? undefined : "2-digit",
	}).format(date);

	return <time dateTime={date.toISOString()}>{formatted}</time>;
};
