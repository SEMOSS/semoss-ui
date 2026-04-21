import { useEffect, useMemo, useState } from "react";
import { Input, Label } from "@semoss/ui/next";
import {
	hasValidDays,
	hasValidHours,
	hasValidMinutes,
	hasValidMonths,
	hasValidWeekdays,
} from "./cronValidator";

const CronField = (props: {
	label: string;
	value: string;
	error: boolean;
	helperText: string;
	onChange: (val: string) => void;
}) => (
	<div className="flex flex-1 flex-col gap-1">
		<Label className="text-xs">{props.label}</Label>
		<Input
			value={props.value}
			onChange={(e) => props.onChange(e.target.value)}
			className={props.error ? "border-destructive" : ""}
		/>
		{props.error && props.helperText && (
			<p className="text-destructive text-xs">{props.helperText}</p>
		)}
	</div>
);

export const JobCustomFrequencyBuilder = (props: {
	cronExpression: string;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { cronExpression, setBuilderField } = props;

	const [cronMinute, setCronMinute] = useState<string>("0");
	const [cronHour, setCronHour] = useState<string>("12");
	const [cronDayOfMonth, setCronDayOfMonth] = useState<string>("*");
	const [cronMonth, setCronMonth] = useState<string>("*");
	const [cronDayOfWeek, setCronDayOfWeek] = useState<string>("?");

	useEffect(() => {
		const cronValues = cronExpression.split(" ");
		if (cronValues.length < 6) return;
		if (!Number.isNaN(cronValues[1]) || cronValues[1] === "*")
			setCronMinute(cronValues[1]);
		if (!Number.isNaN(cronValues[2]) || cronValues[2] === "*")
			setCronHour(cronValues[2]);
		if (!Number.isNaN(cronValues[3]) || cronValues[3] === "*")
			setCronDayOfMonth(cronValues[3]);
		if (!Number.isNaN(cronValues[4]) || cronValues[4] === "*")
			setCronMonth(cronValues[4]);
		if (!Number.isNaN(cronValues[5]) || cronValues[5] === "?")
			setCronDayOfWeek(cronValues[5]);
		if (!Number.isNaN(cronValues[5]) || cronValues[5] === "*")
			setCronDayOfWeek("?");
	}, [cronExpression]);

	useEffect(() => {
		setBuilderField(
			"cronExpression",
			`0 ${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek} *`,
		);
	}, [
		cronMinute,
		cronHour,
		cronDayOfMonth,
		cronMonth,
		cronDayOfWeek,
		setBuilderField,
	]);

	const isMinutesValid = useMemo(
		() => hasValidMinutes(cronMinute),
		[cronMinute],
	);
	const isHoursValid = useMemo(() => hasValidHours(cronHour), [cronHour]);
	const isDayOfMonthValid = useMemo(
		() => hasValidDays(cronDayOfMonth),
		[cronDayOfMonth],
	);
	const isMonthValid = useMemo(() => hasValidMonths(cronMonth), [cronMonth]);
	const isDayOfWeekValid = useMemo(
		() => hasValidWeekdays(cronDayOfWeek),
		[cronDayOfWeek],
	);

	return (
		<div className="flex w-full flex-row gap-2">
			<CronField
				label="Minute"
				value={cronMinute}
				error={isMinutesValid.error}
				helperText={isMinutesValid.errorMessage}
				onChange={setCronMinute}
			/>
			<CronField
				label="Hour"
				value={cronHour}
				error={isHoursValid.error}
				helperText={isHoursValid.errorMessage}
				onChange={setCronHour}
			/>
			<CronField
				label="Day of Month"
				value={cronDayOfMonth}
				error={isDayOfMonthValid.error}
				helperText={isDayOfMonthValid.errorMessage}
				onChange={setCronDayOfMonth}
			/>
			<CronField
				label="Month"
				value={cronMonth}
				error={isMonthValid.error}
				helperText={isMonthValid.errorMessage}
				onChange={setCronMonth}
			/>
			<CronField
				label="Day of Week"
				value={cronDayOfWeek}
				error={isDayOfWeekValid.error}
				helperText={isDayOfWeekValid.errorMessage}
				onChange={setCronDayOfWeek}
			/>
		</div>
	);
};
