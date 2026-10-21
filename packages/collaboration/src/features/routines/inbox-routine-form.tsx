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
	FormSelect,
	FormSwitch,
	SelectItem,
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
import { RoutineFlowSection } from "./routine-flow-section";
import { RoutineNextRun } from "./routine-next-run";
import { RoutineResult } from "./routine-result";
import { RoutineSaveStatus } from "./routine-save-status";
import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";
import { useRoutineAutosave } from "./use-routine-autosave";

const formSchema = inboxRoutineSettingsSchema
	.omit({ lookbackHours: true })
	.extend({
		lookbackAmount: z.string().regex(/^\d+$/, "Choose a whole number."),
		lookbackUnit: z.enum(["hours", "days"]),
	})
	.superRefine(({ lookbackAmount, lookbackUnit }, context) => {
		if (!/^\d+$/.test(lookbackAmount)) return;
		const max = lookbackUnit === "days" ? 30 : 720;
		if (Number(lookbackAmount) < 1 || Number(lookbackAmount) > max) {
			context.addIssue({
				code: "custom",
				path: ["lookbackAmount"],
				message: `Choose between 1 and ${max} ${lookbackUnit}.`,
			});
		}
	});
type RoutineFormValues = z.infer<typeof formSchema>;

/** Keeps input strings at the form boundary and uses the local zone for first setup. */
function formValues(
	routine: InboxRoutine,
	preferredUnit?: RoutineFormValues["lookbackUnit"],
): RoutineFormValues {
	const lookbackUnit =
		preferredUnit ?? (routine.lookbackHours % 24 === 0 ? "days" : "hours");
	return {
		enabled: routine.enabled,
		time: routine.time,
		days: routine.days,
		timezone: routine.configured
			? routine.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone,
		lookbackAmount: String(
			routine.lookbackHours / (lookbackUnit === "days" ? 24 : 1),
		),
		lookbackUnit,
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
	const lookbackUnit = form.watch("lookbackUnit");
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;

	const { status, handleSubmit, retry } = useRoutineAutosave({
		form,
		onSave: async (values) => {
			if (values.enabled && !isAvailable) {
				throw new Error(
					routine.availabilityMessage?.replace(
						/\bBrain\b/g,
						"Settings",
					) ||
						"Connect your inbox and check service availability before enabling this routine.",
				);
			}
			const { lookbackAmount, lookbackUnit, ...settings } = values;
			const saved = await onSave({
				...settings,
				lookbackHours:
					Number(lookbackAmount) * (lookbackUnit === "days" ? 24 : 1),
			});
			return formValues(saved, lookbackUnit);
		},
	});

	return (
		<div className="flex min-w-0 flex-col gap-3">
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
											Changes save automatically. Briefs
											are emailed only to you.
										</span>
									</span>
								}
							/>
							<Separator />
							<FormField
								control={form.control}
								name="days"
								render={({ field, fieldState }) => (
									<Field
										data-invalid={Boolean(fieldState.error)}
									>
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
											aria-invalid={Boolean(
												fieldState.error,
											)}
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
													{ROUTINE_DAY_NAMES[
														day
													].slice(0, 3)}
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
							<FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
								<FormInput
									name="lookbackAmount"
									label="Email lookback (required)"
									description="Review emails received within this period before each run."
									type="number"
									min={1}
									max={lookbackUnit === "days" ? 30 : 720}
									step={1}
									required
								/>
								<FormSelect
									name="lookbackUnit"
									label="Lookback unit (required)"
									required
								>
									<SelectItem value="hours">Hours</SelectItem>
									<SelectItem value="days">Days</SelectItem>
								</FormSelect>
							</FieldGroup>
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
			<RoutineFlowSection title="Inbox daily brief" flow={routine.flow} />
		</div>
	);
}
