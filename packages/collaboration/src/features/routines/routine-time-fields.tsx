import {
	FieldGroup,
	FormInput,
	FormSelect,
	SelectItem,
	useFormContext,
} from "@semoss/ui/next";

/** The local run time and IANA time zone fields of a routine form. */
export function RoutineTimeFields() {
	const { getValues } = useFormContext<{ timezone: string }>();
	// a select rather than a datalist, which only offers zones matching what is typed
	const timezones = Array.from(
		new Set([
			getValues("timezone"),
			"UTC",
			...Intl.supportedValuesOf("timeZone"),
		]),
	).filter(Boolean);
	return (
		<FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
			<FormInput
				name="time"
				label="Run time (required)"
				type="time"
				required
			/>
			<FormSelect name="timezone" label="Time zone (required)">
				{timezones.map((zone) => (
					<SelectItem key={zone} value={zone}>
						{zone.replaceAll("_", " ")}
					</SelectItem>
				))}
			</FormSelect>
		</FieldGroup>
	);
}
