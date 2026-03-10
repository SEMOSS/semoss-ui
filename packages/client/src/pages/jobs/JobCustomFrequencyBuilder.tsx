import { useEffect, useMemo, useState } from "react";
import { Stack, TextField } from "@semoss/ui";
import {
	hasValidDays,
	hasValidHours,
	hasValidMinutes,
	hasValidMonths,
	hasValidWeekdays,
} from "./cronValidator";

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
		if (cronValues.length < 6) {
			// make sure it's valid cron syntax
			return;
		}
		if (!Number.isNaN(cronValues[1]) || cronValues[1] === "*") {
			setCronMinute(cronValues[1]);
		}
		if (!Number.isNaN(cronValues[2]) || cronValues[2] === "*") {
			setCronHour(cronValues[2]);
		}
		if (!Number.isNaN(cronValues[3]) || cronValues[3] === "*") {
			setCronDayOfMonth(cronValues[3]);
		}
		if (!Number.isNaN(cronValues[4]) || cronValues[4] === "*") {
			setCronMonth(cronValues[4]);
		}
		if (!Number.isNaN(cronValues[5]) || cronValues[5] === "?") {
			setCronDayOfWeek(cronValues[5]);
		}
		if (!Number.isNaN(cronValues[5]) || cronValues[5] === "*") {
			setCronDayOfWeek("?");
		}
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

	const isMinutesValid = useMemo(() => {
		return hasValidMinutes(cronMinute);
	}, [cronMinute]);

	const isHoursValid = useMemo(() => {
		return hasValidHours(cronHour);
	}, [cronHour]);

	const isDayOfMonthValid = useMemo(() => {
		return hasValidDays(cronDayOfMonth);
	}, [cronDayOfMonth]);

	const isMonthValid = useMemo(() => {
		return hasValidMonths(cronMonth);
	}, [cronMonth]);

	const isDayOfWeekValid = useMemo(() => {
		return hasValidWeekdays(cronDayOfWeek);
	}, [cronDayOfWeek]);

	return (
		<Stack direction="row" spacing={1} width="100%">
			<TextField
				label="Minute"
				value={cronMinute}
				error={isMinutesValid.error}
				helperText={isMinutesValid.errorMessage}
				onChange={(e) => setCronMinute(e.target.value)}
			/>
			<TextField
				label="Hour"
				value={cronHour}
				error={isHoursValid.error}
				helperText={isHoursValid.errorMessage}
				onChange={(e) => setCronHour(e.target.value)}
			/>
			<TextField
				label="Day of Month"
				value={cronDayOfMonth}
				error={isDayOfMonthValid.error}
				helperText={isDayOfMonthValid.errorMessage}
				onChange={(e) => setCronDayOfMonth(e.target.value)}
			/>
			<TextField
				label="Month"
				value={cronMonth}
				error={isMonthValid.error}
				helperText={isMonthValid.errorMessage}
				onChange={(e) => setCronMonth(e.target.value)}
			/>
			<TextField
				label="Day of Week"
				value={cronDayOfWeek}
				error={isDayOfWeekValid.error}
				helperText={isDayOfWeekValid.errorMessage}
				onChange={(e) => setCronDayOfWeek(e.target.value)}
			/>
		</Stack>
	);
};
