import { CalendarRange } from "lucide-react";
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
	FormSwitch,
	Separator,
	ToggleGroup,
	ToggleGroupItem,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { AgendaMeetingPicker } from "./agenda-meeting-picker";
import {
	type AgendaRoutine,
	type AgendaRoutineSettings,
	agendaRoutineSettingsSchema,
} from "./agenda-routine-schema";
import { RoutineAvailability } from "./routine-availability";
import { RoutineCardHeader } from "./routine-card-header";
import { AGENDA_RESULT_COPY } from "./routine-copy";
import { RoutineFlowSection } from "./routine-flow-section";
import { RoutineNextRun } from "./routine-next-run";
import { RoutineResult } from "./routine-result";
import { RoutineSaveStatus } from "./routine-save-status";
import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";
import { useRoutineAutosave } from "./use-routine-autosave";

/** Keeps saved meetings as they are and uses the local zone for first setup. */
function formValues(routine: AgendaRoutine): AgendaRoutineSettings {
	return {
		enabled: routine.enabled,
		time: routine.time,
		days: routine.days,
		timezone: routine.configured
			? routine.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone,
		meetings: routine.meetings,
		ignored: routine.ignored,
	};
}

interface AgendaRoutineFormProps {
	/** Validated, persisted settings and current service availability. */
	routine: AgendaRoutine;
	/** Saves the complete schedule and meeting list; rejected writes leave the draft intact. */
	onSave: (values: AgendaRoutineSettings) => Promise<AgendaRoutine>;
}

/** The weekly agenda opt-in: schedule, the meetings to prepare, and the save lifecycle. */
export function AgendaRoutineForm({ routine, onSave }: AgendaRoutineFormProps) {
	const id = useId();
	const form = useForm<AgendaRoutineSettings>({
		resolver: zodResolver(agendaRoutineSettingsSchema),
		defaultValues: formValues(routine),
		shouldFocusError: false,
	});
	const { errors, isSubmitting } = form.formState;
	const ignored = form.watch("ignored");
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
			return formValues(await onSave(values));
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
						icon={CalendarRange}
						title="Weekly meeting agendas"
						description="Proposed agendas for your selected meetings."
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
								label="Enable weekly agendas"
								aria-describedby={`${id}-opt-in`}
								description={
									<span
										id={`${id}-opt-in`}
										className="flex flex-col gap-2"
									>
										<RoutineNextRun routine={routine} />
										<span>
											Changes save automatically. Your
											agendas are emailed only to you.
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
										<FieldLabel id={`${id}-day-label`}>
											Run on (required)
										</FieldLabel>
										<ToggleGroup
											type="single"
											variant="outline"
											spacing={1}
											className="flex-wrap"
											value={field.value[0] ?? ""}
											onValueChange={(day) =>
												field.onChange(day ? [day] : [])
											}
											onBlur={field.onBlur}
											aria-labelledby={`${id}-day-label`}
											aria-describedby={
												fieldState.error
													? `${id}-day-error`
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
											<FieldError id={`${id}-day-error`}>
												{fieldState.error.message}
											</FieldError>
										)}
									</Field>
								)}
							/>
							<RoutineTimeFields />
							<FormField
								control={form.control}
								name="meetings"
								render={({ field, fieldState }) => (
									<AgendaMeetingPicker
										meetings={field.value}
										ignored={ignored}
										onMeetingsChange={field.onChange}
										onIgnoredChange={(next) =>
											form.setValue("ignored", next, {
												shouldDirty: true,
											})
										}
										onBlur={field.onBlur}
										inputRef={field.ref}
										saved={routine.meetings}
										disabled={false}
										error={fieldState.error?.message}
									/>
								)}
							/>
						</FieldGroup>
						<div className="flex min-w-0 flex-col">
							<RoutineResult
								routine={routine}
								copy={AGENDA_RESULT_COPY}
							/>
						</div>
					</CardContent>
					<RoutineAvailability
						routine={routine}
						isAvailable={isAvailable}
					/>
				</Form>
			</Card>
			<RoutineFlowSection
				title="Weekly meeting agendas"
				flow={routine.flow}
			/>
		</div>
	);
}
