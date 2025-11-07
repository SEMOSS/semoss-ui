import { useEffect, useMemo, useState } from "react";
import { Stack, TextField } from "@semoss/ui";
import { cronValidator } from "./cronValidator";
import type { JobBuilder } from "./job.types";

// Helper for default values
const DEFAULT_CRON = ["0", "0", "12", "?", "*", "?", "*"];

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
			{cronValidator.fieldNames.map((label, idx) => (
				<TextField
					key={label}
					label={label}
					value={cronFields[idx]}
					size="small"
					sx={
						!isValidExpression
							? {
									"& .MuiOutlinedInput-root": {
										"& fieldset": {
											borderColor: "error.main",
										},
										"&:hover fieldset": {
											borderColor: "error.main",
										},
									},
								}
							: undefined
					}
					onChange={(e) => handleFieldChange(idx, e.target.value)}
				/>
			))}
		</Stack>
	);
};
