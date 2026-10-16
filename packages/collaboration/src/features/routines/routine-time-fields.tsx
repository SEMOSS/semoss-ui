import { useId } from "react";
import { FieldGroup, FormInput, useFormContext } from "@semoss/ui/next";

/** The local run time and IANA time zone fields of a routine form. */
export function RoutineTimeFields() {
	const id = useId();
	const { getValues } = useFormContext<{ timezone: string }>();
	const timezones = Array.from(
		new Set([
			getValues("timezone"),
			"UTC",
			...Intl.supportedValuesOf("timeZone"),
		]),
	);
	return (
		<>
			<FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
				<FormInput
					name="time"
					label="Run time (required)"
					type="time"
					required
				/>
				<FormInput
					name="timezone"
					label="Time zone (required)"
					list={`${id}-timezones`}
					required
				/>
			</FieldGroup>
			<datalist id={`${id}-timezones`}>
				{timezones.map((zone) => (
					<option key={zone} value={zone} />
				))}
			</datalist>
		</>
	);
}
