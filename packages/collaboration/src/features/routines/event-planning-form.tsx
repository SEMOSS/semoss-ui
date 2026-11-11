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
	FormTextarea,
	Separator,
	ToggleGroup,
	ToggleGroupItem,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { EventPlanningCalendar } from "./event-planning-calendar";
import { EventPlanningMeetingEditor } from "./event-planning-meeting-editor";
import {
	type EventPlanningRoutine,
	type EventPlanningSettings,
	eventPlanningSettingsSchema,
	type MeetingPin,
	pinKey,
} from "./event-planning-schema";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { RoutineAvailability } from "./routine-availability";
import { RoutineCardHeader } from "./routine-card-header";
import { EVENT_PLANNING_RESULT_COPY } from "./routine-copy";
import { RoutineFlowSection } from "./routine-flow-section";
import { RoutineNextRun } from "./routine-next-run";
import { RoutineResult } from "./routine-result";
import { RoutineRunNowButton } from "./routine-run-now-button";
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
	const form = useForm<EventPlanningSettings>({
		resolver: zodResolver(eventPlanningSettingsSchema),
		defaultValues: formValues(routine),
		shouldFocusError: false,
	});
	const { errors, isSubmitting } = form.formState;
	const ignored = form.watch("ignored");
	const meetings = form.watch("meetings");
	const [selectedKey, setSelectedKey] = useState(
		routine.meetings[0] ? pinKey(routine.meetings[0]) : "",
	);
	const selectedIndex = meetings.findIndex(
		(meeting) => pinKey(meeting) === selectedKey,
	);

	// a new meeting is added and opened; a chosen one just opens
	const choose = (pin: MeetingPin) => {
		const key = pinKey(pin);
		if (!meetings.some((meeting) => pinKey(meeting) === key)) {
			form.setValue(
				"ignored",
				ignored.filter((other) => pinKey(other) !== key),
				{ shouldDirty: true },
			);
			form.setValue("meetings", [...meetings, pin], {
				shouldDirty: true,
				shouldValidate: true,
			});
		}
		setSelectedKey(key);
	};
	const remove = (key: string) => {
		const next = meetings.filter((meeting) => pinKey(meeting) !== key);
		form.setValue("meetings", next, {
			shouldDirty: true,
			shouldValidate: true,
		});
		if (key === selectedKey) setSelectedKey(next[0] ? pinKey(next[0]) : "");
	};
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;

	const { status, handleSubmit, retry, flush } = useRoutineAutosave({
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
	// the run reads the saved routine, so an edit still waiting to save goes first
	const handleRunNow = async () => {
		await flush();
		return onRunNow();
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
						avatar={
							<RoutineAgentAvatar routineId="event-planning" />
						}
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
							<RoutineRunNowButton
								routine={routine}
								onRunNow={handleRunNow}
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
								onRunNow={handleRunNow}
							/>
						</div>
					</CardContent>
					<Separator />
					<section
						aria-label="Meetings to plan"
						className="flex min-w-0 flex-col gap-4 py-6"
					>
						<div className="flex flex-wrap items-center gap-2 px-6">
							<h3 className="mr-2 font-medium text-sm">
								Meetings to plan
							</h3>
							{meetings.map((meeting) => (
								<Button
									key={pinKey(meeting)}
									type="button"
									size="sm"
									variant={
										pinKey(meeting) === selectedKey
											? "default"
											: "outline"
									}
									onClick={() =>
										setSelectedKey(pinKey(meeting))
									}
								>
									{meeting.title}
								</Button>
							))}
							{meetings.length === 0 && (
								<span className="text-muted-foreground text-sm">
									Pick a meeting on your calendar to start.
								</span>
							)}
						</div>
						<div className="grid min-w-0 gap-6 px-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
							<EventPlanningCalendar
								meetings={meetings}
								selectedKey={selectedKey}
								onChoose={choose}
								error={
									errors.meetings?.message ??
									errors.meetings?.root?.message
								}
							/>
							<aside className="min-w-0 rounded-lg border p-4">
								{selectedIndex >= 0 ? (
									<EventPlanningMeetingEditor
										key={selectedKey}
										index={selectedIndex}
										pin={meetings[selectedIndex]}
										onRemove={() => remove(selectedKey)}
									/>
								) : (
									<p className="text-muted-foreground text-sm">
										Click a meeting on the calendar to plan
										it. You can then say what it is for and
										which topics it covers.
									</p>
								)}
							</aside>
						</div>
					</section>
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
