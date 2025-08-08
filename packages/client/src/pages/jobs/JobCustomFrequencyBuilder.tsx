<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { Stack, TextField } from "@semoss/ui";
import { cronValidator } from "./cronValidator";
import { JobBuilder } from "./job.types";

// Helper for default values
const DEFAULT_CRON = ["0", "0", "12", "?", "*", "?", "*"];
const CRON_LABELS = [
	"Seconds",
	"Minutes",
	"Hours",
	"Day of Month",
	"Month",
	"Day of Week",
	"Year",
];
=======
import { useEffect, useState } from "react";
import { Stack, TextField } from "@semoss/ui";
import type { JobBuilder } from "./job.types";
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053

export const JobCustomFrequencyBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;

<<<<<<< HEAD
	// Initialize state for each cron field
	const [cronFields, setCronFields] = useState<string[]>(DEFAULT_CRON);

	// On mount or when builder.cronExpression changes, sync state from builder
	useEffect(() => {
		const fields = builder.cronExpression?.split(" ") ?? [];
		while (fields.length < 7) fields.push("*");
		setCronFields(fields.slice(0, 7));
	}, [builder.cronExpression]);

	// Use cronValidator to validate the entire expression
	const cronValidation = useMemo(() => {
		const expression = cronFields.join(" ");
		const result = cronValidator.validate(expression);
		if (!result.isValid && result.errors.length > 0) {
			console.log("Cron validation errors:", result.errors);
		}
		return result;
	}, [cronFields]);

	// Check if the current expression is valid
	const isValidExpression = cronValidation.isValid;

	// Handler for field changes
	const handleFieldChange = (idx: number, value: string) => {
		const newFields = [...cronFields];
		newFields[idx] = value;
		setCronFields(newFields);
		// Update the builder immediately when user changes a field
		setBuilderField("cronExpression", newFields.join(" "));
	};

	return (
		<Stack direction="row" spacing={1} width="100%">
			{CRON_LABELS.map((label, idx) => (
				<TextField
					key={label}
					label={label}
					value={cronFields[idx]}
					error={!isValidExpression}
					size="small"
					onChange={(e) => handleFieldChange(idx, e.target.value)}
				/>
			))}
=======
	const [cronMinute, setCronMinute] = useState<string>("0");
	const [cronHour, setCronHour] = useState<string>("12");
	const [cronDayOfMonth, setCronDayOfMonth] = useState<string>("*");
	const [cronMonth, setCronMonth] = useState<string>("*");
	const [cronDayOfWeek, setCronDayOfWeek] = useState<string>("?");

	useEffect(() => {
		const cronValues = builder.cronExpression.split(" ");
		if (cronValues.length < 6) {
			// make sure it's valid cron syntax
			return;
		}
		if (!Number.isNaN(cronValues[1]) || cronValues[1] == "*") {
			setCronMinute(cronValues[1]);
		}
		if (!Number.isNaN(cronValues[2]) || cronValues[2] == "*") {
			setCronHour(cronValues[2]);
		}
		if (!Number.isNaN(cronValues[3]) || cronValues[3] == "*") {
			setCronDayOfMonth(cronValues[3]);
		}
		if (!Number.isNaN(cronValues[4]) || cronValues[4] == "*") {
			setCronMonth(cronValues[4]);
		}
		if (!Number.isNaN(cronValues[5]) || cronValues[5] == "?") {
			setCronDayOfWeek(cronValues[5]);
		}
	}, []);
	useEffect(() => {
		setBuilderField(
			"cronExpression",
			`0 ${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek} *`,
		);
	}, [cronMinute, cronHour, cronDayOfMonth, cronMonth, cronDayOfWeek]);

	return (
		<Stack direction="row" spacing={1} width="100%">
			<TextField
				label="Minute"
				value={cronMinute}
				error={
					cronMinute !== "*" &&
					!(
						!Number.isNaN(cronMinute) &&
						parseInt(cronMinute) <= 59 &&
						parseInt(cronMinute) >= 0
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
						parseInt(cronHour) <= 23 &&
						parseInt(cronHour) >= 0
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
						parseInt(cronDayOfMonth) <= 31 &&
						parseInt(cronDayOfMonth) >= 0
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
						parseInt(cronMonth) <= 12 &&
						parseInt(cronMonth) >= 1
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
						parseInt(cronDayOfWeek) <= 6 &&
						parseInt(cronDayOfWeek) >= 0
					)
				}
				onChange={(e) => setCronDayOfWeek(e.target.value)}
			/>
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
		</Stack>
	);
};
