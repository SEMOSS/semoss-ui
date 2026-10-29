import { Play } from "lucide-react";
import { useId, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Form,
	FormField,
	FormSwitch,
	FormTextarea,
	Separator,
	ToggleGroup,
	ToggleGroupItem,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { EventPlanningPicker } from "./event-planning-picker";
import {
	type EventPlanningRoutine,
	type EventPlanningSettings,
	eventPlanningSettingsSchema,
} from "./event-planning-schema";
import { EventPlanningAgentIcon } from "./routine-agent-icons";
import { RoutineAvailability } from "./routine-availability";
import { RoutineCardHeader } from "./routine-card-header";
import { EVENT_PLANNING_RESULT_COPY } from "./routine-copy";
import { RoutineFlowSection } from "./routine-flow-section";
import { RoutineNextRun } from "./routine-next-run";
import { RoutineResult } from "./routine-result";
import { RoutineSaveStatus } from "./routine-save-status";
import {
	ROUTINE_DAY_NAMES,
	ROUTINE_DAYS,
	ROUTINE_PREFERENCES_LIMIT,
} from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";
import { useRoutineAutosave } from "./use-routine-autosave";

/** Keeps saved pins as they are and uses the local zone for first setup. */
function formValues(routine: EventPlanningRoutine): EventPlanningSettings {
	return {
		enabled: routine.enabled,
		time: routine.time,
		days: routine.days,
		timezone: routine.configured
			? routine.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone,
		meetings: routine.meetings,
		ignored: routine.ignored,
		preferences: routine.preferences,
	};
}

interface EventPlanningFormProps {
	/** Validated, persisted settings and current service availability. */
	routine: EventPlanningRoutine;
	/** Saves the complete schedule and pins; rejected writes leave the draft intact. */
	onSave: (values: EventPlanningSettings) => Promise<EventPlanningRoutine>;
	/** Starts a run now and returns the routine as it reads after. */
	onRunNow: () => Promise<EventPlanningRoutine>;
}

/** The event planning opt-in: schedule, the pinned meetings, and the save lifecycle. */
export function EventPlanningForm({
	routine,
	onSave,
	onRunNow,
}: EventPlanningFormProps) {
	const id = useId();
	const [isStarting, setIsStarting] = useState(false);
	const [runError, setRunError] = useState("");
	const form = useForm<EventPlanningSettings>({
		resolver: zodResolver(eventPlanningSettingsSchema),
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

	const runNow = async () => {
		setIsStarting(true);
		setRunError("");
		try {
			await onRunNow();
		} catch (cause) {
			setRunError(
				cause instanceof Error
					? cause.message
					: "The run did not start.",
			);
		} finally {
			setIsStarting(false);
		}
	};

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
						icon={EventPlanningAgentIcon}
						isAvatar
						title="Event planning agent"
						description="Who presents what, for how long, and who has confirmed, kept in a sheet emailed to you."
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
								label="Enable event planning"
								aria-describedby={`${id}-opt-in`}
								description={
									<span
										id={`${id}-opt-in`}
										className="flex flex-col gap-2"
									>
										<RoutineNextRun routine={routine} />
										<span>
											Changes save automatically. Each
											meeting's sheet is attached to the
											email you get; asks to presenters
											are saved as drafts, never sent.
										</span>
									</span>
								}
							/>
							<div className="flex flex-col gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-fit"
									disabled={
										isStarting ||
										!routine.enabled ||
										routine.lastRun?.status === "running"
									}
									onClick={() => void runNow()}
								>
									<Play
										aria-hidden="true"
										data-icon="inline-start"
									/>
									Run now
								</Button>
								{runError && (
									<Alert variant="destructive">
										<AlertDescription>
											{runError}
										</AlertDescription>
									</Alert>
								)}
							</div>
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
									<EventPlanningPicker
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
										error={fieldState.error?.message}
									/>
								)}
							/>
							<FormTextarea
								name="preferences"
								label="Preferences (optional)"
								description="How the lineups should be planned, such as: at most two topics per sitting, leave 5 minutes for questions, never ask the same person two sittings in a row."
								rows={3}
								maxLength={ROUTINE_PREFERENCES_LIMIT}
							/>
						</FieldGroup>
						<div className="flex min-w-0 flex-col">
							<RoutineResult
								routine={routine}
								copy={EVENT_PLANNING_RESULT_COPY}
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
				title="Event planning agent"
				flow={routine.flow}
			/>
		</div>
	);
}
