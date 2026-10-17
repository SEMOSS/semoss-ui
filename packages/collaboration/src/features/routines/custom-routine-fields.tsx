import { useId } from "react";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FormField,
	FormInput,
	FormSelect,
	FormTextarea,
	SelectItem,
	ToggleGroup,
	ToggleGroupItem,
	useFormContext,
} from "@semoss/ui/next";
import {
	CUSTOM_ROUTINE_DELIVERIES,
	type CustomRoutineSettings,
	DELIVERY_LABELS,
	type MySkill,
} from "./custom-routine-schema";
import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";

interface CustomRoutineFieldsProps {
	/** The owner's own skills the routine can load. */
	skills: MySkill[];
}

/** What, when, and where of one of the owner's routines. */
export function CustomRoutineFields({ skills }: CustomRoutineFieldsProps) {
	const id = useId();
	const form = useFormContext<CustomRoutineSettings>();
	return (
		<FieldGroup className="min-w-0">
			<FormInput name="name" label="Name (required)" required />
			<FormTextarea
				name="prompt"
				label="What should it do? (required)"
				description="Write it the way you would ask your assistant, such as: summarize what my clients asked for since yesterday, grouped by client."
				rows={4}
			/>
			<FormSelect name="delivery" label="Send the result">
				{CUSTOM_ROUTINE_DELIVERIES.map((delivery) => (
					<SelectItem key={delivery} value={delivery}>
						{DELIVERY_LABELS[delivery]}
					</SelectItem>
				))}
			</FormSelect>
			<FormField
				control={form.control}
				name="days"
				render={({ field, fieldState }) => (
					<Field data-invalid={Boolean(fieldState.error)}>
						<FieldLabel id={`${id}-days-label`}>
							Run on (required)
						</FieldLabel>
						<ToggleGroup
							type="multiple"
							variant="outline"
							spacing={1}
							className="flex-wrap"
							value={field.value}
							onValueChange={field.onChange}
							onBlur={field.onBlur}
							aria-labelledby={`${id}-days-label`}
							aria-invalid={Boolean(fieldState.error)}
						>
							{ROUTINE_DAYS.map((day) => (
								<ToggleGroupItem
									key={day}
									value={day}
									aria-label={ROUTINE_DAY_NAMES[day]}
									className="min-h-11 min-w-11"
								>
									{ROUTINE_DAY_NAMES[day].slice(0, 3)}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
						{fieldState.error && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</Field>
				)}
			/>
			<RoutineTimeFields />
			{skills.length > 0 && (
				<FormField
					control={form.control}
					name="skills"
					render={({ field }) => (
						<Field>
							<FieldLabel id={`${id}-skills-label`}>
								Skills to use
							</FieldLabel>
							<ToggleGroup
								type="multiple"
								variant="outline"
								spacing={1}
								className="flex-wrap justify-start"
								value={field.value}
								onValueChange={field.onChange}
								aria-labelledby={`${id}-skills-label`}
							>
								{skills.map((skill) => (
									<ToggleGroupItem
										key={skill.id}
										value={skill.id}
										title={skill.description ?? undefined}
									>
										{skill.name}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<FieldDescription>
								Only skills you made are offered.
							</FieldDescription>
						</Field>
					)}
				/>
			)}
		</FieldGroup>
	);
}
