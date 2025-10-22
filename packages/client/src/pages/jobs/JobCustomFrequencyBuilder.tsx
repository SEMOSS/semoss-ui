import { useEffect, useState } from "react";
import { Stack, TextField } from "@semoss/ui";

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

	return (
		<Stack direction="row" spacing={1} width="100%">
			<TextField
				label="Minute"
				value={cronMinute}
				error={
					cronMinute !== "*" &&
					!(
						!Number.isNaN(cronMinute) &&
						parseInt(cronMinute, 10) <= 59 &&
						parseInt(cronMinute, 10) >= 0
					)
				}
				onChange={(e) => setCronMinute(e.target.value)}
			/>
			<TextField
				label="Hour"
				value={cronHour}
				error={
					cronHour !== "*" &&
					!(
						!Number.isNaN(cronHour) &&
						parseInt(cronHour, 10) <= 23 &&
						parseInt(cronHour, 10) >= 0
					)
				}
				onChange={(e) => setCronHour(e.target.value)}
			/>
			<TextField
				label="Day of Month"
				value={cronDayOfMonth}
				error={
					cronDayOfMonth !== "*" &&
					!(
						!Number.isNaN(cronDayOfMonth) &&
						parseInt(cronDayOfMonth, 10) <= 31 &&
						parseInt(cronDayOfMonth, 10) >= 0
					)
				}
				onChange={(e) => setCronDayOfMonth(e.target.value)}
			/>
			<TextField
				label="Month"
				value={cronMonth}
				error={
					cronMonth !== "*" &&
					!(
						!Number.isNaN(cronMonth) &&
						parseInt(cronMonth, 10) <= 12 &&
						parseInt(cronMonth, 10) >= 1
					)
				}
				onChange={(e) => setCronMonth(e.target.value)}
			/>
			<TextField
				label="Day of Week"
				value={cronDayOfWeek}
				error={
					cronDayOfWeek !== "?" &&
					!(
						!Number.isNaN(cronDayOfWeek) &&
						parseInt(cronDayOfWeek, 10) <= 6 &&
						parseInt(cronDayOfWeek, 10) >= 0
					)
				}
				onChange={(e) => setCronDayOfWeek(e.target.value)}
			/>
		</Stack>
	);
};
