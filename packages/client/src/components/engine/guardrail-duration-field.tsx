import {
	FieldDescription,
	FieldLegend,
	FieldSet,
	FormField,
	FormInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useFormContext,
} from "@semoss/ui/next";

export interface GuardrailDurationFieldProps {
	/** What the duration is, shown at the top of its box, such as "Lock the user out for" */
	legend: string;

	/** A line under the controls */
	description?: string;

	/** The accessible name of the number, such as "Lock length" */
	amountLabel: string;

	/** The accessible name of the unit, such as "Lock unit" */
	unitLabel: string;

	/** React Hook Form path of the amount, a whole number as text */
	amountName: string;

	/** React Hook Form path of the unit: minutes, hours or days */
	unitName: string;

	/** Whether the fields accept edits */
	disabled?: boolean;

	/** Prefix for the fields' test ids */
	testIdPrefix: string;
}

/**
 * A length of time as a whole number of minutes, hours or days, in a box of its
 * own: its title on top, the number and the unit side by side, and a hint below,
 * so the title reads with its own two controls.
 */
export const GuardrailDurationField = ({
	legend,
	description,
	amountLabel,
	unitLabel,
	amountName,
	unitName,
	disabled,
	testIdPrefix,
}: GuardrailDurationFieldProps) => {
	const { control } = useFormContext();

	return (
		<FieldSet className="gap-2 rounded-md border p-3">
			<FieldLegend variant="label" className="mb-0">
				{legend}
			</FieldLegend>
			<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
				<FormInput
					name={amountName}
					aria-label={amountLabel}
					type="number"
					min={1}
					step={1}
					inputMode="numeric"
					disabled={disabled}
					data-testid={`${testIdPrefix}-amount`}
				/>
				<FormField
					control={control}
					name={unitName}
					render={({ field }) => (
						<Select
							value={field.value}
							// the hidden native select reports an empty value while
							// the option list is unmounted, which is never a unit
							onValueChange={(next) =>
								next && field.onChange(next)
							}
							disabled={disabled}
						>
							<SelectTrigger
								aria-label={unitLabel}
								className="w-full"
								data-testid={`${testIdPrefix}-unit`}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="minutes">Minutes</SelectItem>
								<SelectItem value="hours">Hours</SelectItem>
								<SelectItem value="days">Days</SelectItem>
							</SelectContent>
						</Select>
					)}
				/>
			</div>
			{description ? (
				<FieldDescription>{description}</FieldDescription>
			) : null}
		</FieldSet>
	);
};
