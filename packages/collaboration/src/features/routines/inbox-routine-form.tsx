import { Inbox } from "lucide-react";
import { useId } from "react";
import {
	Card,
	CardContent,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Form,
	FormField,
	FormInput,
	FormSwitch,
	Separator,
	ToggleGroup,
	ToggleGroupItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	type InboxRoutine,
	type InboxRoutineSettings,
	inboxRoutineSettingsSchema,
} from "./inbox-routine-schema";
import { RoutineAvailability } from "./routine-availability";
import { RoutineCardHeader } from "./routine-card-header";
import { INBOX_RESULT_COPY } from "./routine-copy";
import { RoutineNextRun } from "./routine-next-run";
import { RoutineResult } from "./routine-result";
import { RoutineSaveStatus } from "./routine-save-status";
import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";
import { useRoutineAutosave } from "./use-routine-autosave";

const formSchema = inboxRoutineSettingsSchema
	.omit({ emailCount: true })
	.extend({
		emailCount: z
			.string()
			.regex(/^\d+$/, "Choose a whole number of emails.")
			.refine(
				(value) => Number(value) >= 1 && Number(value) <= 100,
				"Choose between 1 and 100 emails.",
			),
	});
type RoutineFormValues = z.infer<typeof formSchema>;

/** Keeps input strings at the form boundary and uses the local zone for first setup. */
function formValues(routine: InboxRoutine): RoutineFormValues {
	return {
		enabled: routine.enabled,
		time: routine.time,
		days: routine.days,
		timezone: routine.configured
			? routine.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone,
		emailCount: String(routine.emailCount),
	};
}

interface InboxRoutineFormProps {
	/** Validated, persisted settings and current service availability. */
	routine: InboxRoutine;
	/** Saves the complete schedule; rejected writes leave the draft intact. */
	onSave: (values: InboxRoutineSettings) => Promise<InboxRoutine>;
}

/** A single opt-in form owns the schedule, inbox scope, and save lifecycle. */
export function InboxRoutineForm({ routine, onSave }: InboxRoutineFormProps) {
	const id = useId();
	const form = useForm<RoutineFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: formValues(routine),
		shouldFocusError: false,
	});
	const { errors, isSubmitting } = form.formState;
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;

	const { status, handleSubmit, retry } = useRoutineAutosave({
		form,
		onSave: async (values) => {
			if (values.enabled && !isAvailable) {
				throw new Error(
					routine.availabilityMessage ||
						"Connect your inbox and check service availability before enabling this routine.",
				);
			}
			const saved = await onSave({
				...values,
				emailCount: Number(values.emailCount),
			});
			return formValues(saved);
		},
	});

	return (
		<Card className="gap-0 overflow-hidden py-0 shadow-none">
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSubmitting}
			>
				<RoutineCardHeader
					icon={Inbox}
					title="Inbox daily brief"
					description="Your inbox, priorities, and upcoming deadlines."
					routine={routine}
					saveStatus={
						<RoutineSaveStatus
							status={status}
							error={errors.root?.server?.message}
							onRetry={retry}
						/>
					}
				/>
				<CardContent className="grid min-w-0 gap-8 py-6 lg:grid-cols-2">
					<FieldGroup className="min-w-0">
						<FormSwitch
							name="enabled"
							label="Enable daily brief"
							aria-describedby={`${id}-opt-in`}
							description={
								<span
									id={`${id}-opt-in`}
									className="flex flex-col gap-2"
								>
									<RoutineNextRun routine={routine} />
									<span>
										Changes save automatically. Briefs are
										emailed only to you.
									</span>
								</span>
							}
						/>
						<Separator />
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
										aria-describedby={
											fieldState.error
												? `${id}-days-error`
												: undefined
										}
										aria-invalid={Boolean(fieldState.error)}
									>
										{ROUTINE_DAYS.map((day, index) => (
											<ToggleGroupItem
												key={day}
												value={day}
												aria-label={
													ROUTINE_DAY_NAMES[day]
												}
												ref={
													index === 0
														? field.ref
														: undefined
												}
												className="min-h-11 min-w-11"
											>
												{ROUTINE_DAY_NAMES[day].slice(
													0,
													3,
												)}
											</ToggleGroupItem>
										))}
									</ToggleGroup>
									{fieldState.error && (
										<FieldError id={`${id}-days-error`}>
											{fieldState.error.message}
										</FieldError>
									)}
								</Field>
							)}
						/>
						<RoutineTimeFields />
						<FormInput
							name="emailCount"
							label="Emails to review for replies (required)"
							type="number"
							min={1}
							max={100}
							step={1}
							required
							className="max-w-md"
						/>
					</FieldGroup>
					<div className="min-w-0">
						<RoutineResult
							routine={routine}
							copy={INBOX_RESULT_COPY}
						/>
					</div>
				</CardContent>
				<RoutineAvailability
					routine={routine}
					isAvailable={isAvailable}
				/>
			</Form>
		</Card>
	);
}
