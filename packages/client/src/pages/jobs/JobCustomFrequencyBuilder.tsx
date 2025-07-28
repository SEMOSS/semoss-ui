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

export const JobCustomFrequencyBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;

	// Initialize state for each cron field
	const [cronFields, setCronFields] = useState<string[]>(DEFAULT_CRON);

	// On mount or when builder.cronExpression changes, sync state from builder
	useEffect(() => {
		const fields = builder.cronExpression?.split(" ") ?? [];
		while (fields.length < 7) fields.push("*");
		setCronFields(fields.slice(0, 7));
	}, [builder.cronExpression]);

	// When any cron field changes, update the builder's cronExpression
	useEffect(() => {
		setBuilderField("cronExpression", cronFields.join(" "));
	}, [cronFields, setBuilderField]);

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
	};

	return (
		<Stack direction="row" spacing={1} width="100%">
			{CRON_LABELS.map((label, idx) => (
				<TextField
					key={label}
					label={label}
					value={cronFields[idx]}
					error={!isValidExpression}
					helperText={
						!isValidExpression && idx === 0
							? cronValidation.errors[0]
							: undefined
					}
					onChange={(e) => handleFieldChange(idx, e.target.value)}
				/>
			))}
		</Stack>
	);
};
