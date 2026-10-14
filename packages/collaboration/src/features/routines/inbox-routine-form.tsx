import {
	CalendarClock,
	Check,
	ChevronDown,
	Inbox,
	LockKeyhole,
} from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Form,
	FormActions,
	FormField,
	FormInput,
	FormSwitch,
	H2,
	H3,
	P,
	Separator,
	Small,
	ToggleGroup,
	ToggleGroupItem,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	INBOX_ROUTINE_DAYS,
	type InboxRoutine,
	type InboxRoutineSettings,
	inboxRoutineSettingsSchema,
} from "./inbox-routine-schema";

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

const dayNames = {
	MON: "Monday",
	TUE: "Tuesday",
	WED: "Wednesday",
	THU: "Thursday",
	FRI: "Friday",
	SAT: "Saturday",
	SUN: "Sunday",
};

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;

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
	});
	const { errors, isSubmitting, isDirty } = form.formState;
	const [isScheduleOpen, setIsScheduleOpen] = useState(false);
	const schedule = form.watch();
	const enabled = form.watch("enabled");
	const daysLabel =
		schedule.days.length === 7
			? "Every day"
			: schedule.days.length === 5 &&
					WEEKDAYS.every((day) => schedule.days.includes(day))
				? "Weekdays"
				: schedule.days
						.map((day) => dayNames[day].slice(0, 3))
						.join(", ") || "Choose days";
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;
	// Service guidance still uses the former navigation label.
	const availabilityMessage = routine.availabilityMessage?.replace(
		/\bBrain\b/g,
		"Settings",
	);
	const status = routine.enabled
		? "Scheduled"
		: routine.configured
			? "Paused"
			: "Not enabled";
	const nextRun = routine.nextRunAt
		? new Intl.DateTimeFormat(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: routine.timezone,
			}).format(new Date(routine.nextRunAt))
		: null;
	const timezones = Array.from(
		new Set([
			form.getValues("timezone"),
			"UTC",
			...Intl.supportedValuesOf("timeZone"),
		]),
	);

	async function handleSubmit(values: RoutineFormValues): Promise<void> {
		if (values.enabled && !isAvailable) {
			form.setError("root.server", {
				message:
					availabilityMessage ||
					"Connect your inbox and check service availability before enabling this routine.",
			});
			return;
		}
		let saved: InboxRoutine;
		try {
			saved = await onSave({
				...values,
				emailCount: Number(values.emailCount),
			});
		} catch (error: unknown) {
			form.setError("root.server", {
				message:
					error instanceof Error
						? error.message
						: "Your routine could not be saved. Please try again.",
			});
			return;
		}
		form.reset(formValues(saved));
		toast.success(
			saved.enabled
				? "Inbox daily brief scheduled"
				: "Inbox daily brief paused",
		);
	}

	return (
		<Card className="gap-0 overflow-hidden py-0 shadow-none">
			<CardHeader className="gap-3 border-b py-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<Inbox
							className="size-5 shrink-0 text-muted-foreground"
							aria-hidden="true"
						/>
						<CardTitle>
							<H2 className="text-xl">Inbox daily brief</H2>
						</CardTitle>
					</div>
					<Badge variant={routine.enabled ? "outline" : "secondary"}>
						{routine.enabled && <Check aria-hidden="true" />}
						{status}
					</Badge>
				</div>
				<CardDescription>
					Start your day with a clear summary of your latest emails,
					what needs a reply, and upcoming deadlines.
				</CardDescription>
			</CardHeader>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSubmitting}
				onError={(fieldErrors) => {
					const firstField = (
						["days", "time", "timezone", "emailCount"] as const
					).find((name) => fieldErrors[name]);
					if (firstField) {
						setIsScheduleOpen(true);
						requestAnimationFrame(() => form.setFocus(firstField));
					}
				}}
			>
				<CardContent className="grid min-w-0 gap-8 py-6 lg:grid-cols-5">
					<FieldGroup className="min-w-0 lg:col-span-3">
						<FormSwitch
							name="enabled"
							label="Enable daily brief"
							disabled={isSubmitting}
							aria-describedby={`${id}-opt-in`}
							description={
								<span id={`${id}-opt-in`}>
									Runs automatically after you enable it and
									save your schedule.
								</span>
							}
						/>
						<Separator />
						<Collapsible
							open={isScheduleOpen}
							onOpenChange={setIsScheduleOpen}
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="space-y-1">
									<P className="text-sm">
										{daysLabel} at {schedule.time || "—"}
									</P>
									<P className="text-muted-foreground text-xs">
										{schedule.timezone.replaceAll("_", " ")}{" "}
										· Up to {schedule.emailCount || "—"}{" "}
										emails
									</P>
								</div>
								<CollapsibleTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="pointer-coarse:min-h-11 font-normal"
										disabled={isSubmitting}
									>
										{isScheduleOpen
											? "Hide schedule"
											: "Change schedule"}
										<ChevronDown
											aria-hidden="true"
											className="size-4"
										/>
									</Button>
								</CollapsibleTrigger>
							</div>
							<CollapsibleContent
								forceMount
								hidden={!isScheduleOpen}
								className="space-y-6 pt-6"
							>
								<FormField
									control={form.control}
									name="days"
									render={({ field, fieldState }) => (
										<Field
											data-invalid={Boolean(
												fieldState.error,
											)}
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
												disabled={isSubmitting}
											>
												{INBOX_ROUTINE_DAYS.map(
													(day, index) => (
														<ToggleGroupItem
															key={day}
															value={day}
															aria-label={
																dayNames[day]
															}
															ref={
																index === 0
																	? field.ref
																	: undefined
															}
															className="min-h-11 min-w-11"
														>
															{dayNames[
																day
															].slice(0, 3)}
														</ToggleGroupItem>
													),
												)}
											</ToggleGroup>
											{fieldState.error && (
												<FieldError
													id={`${id}-days-error`}
												>
													{fieldState.error.message}
												</FieldError>
											)}
										</Field>
									)}
								/>
								<FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
									<FormInput
										name="time"
										label="Run time (required)"
										type="time"
										required
										disabled={isSubmitting}
									/>
									<FormInput
										name="timezone"
										label="Time zone (required)"
										list={`${id}-timezones`}
										required
										disabled={isSubmitting}
										description="Keeps your chosen local time as daylight saving changes."
									/>
								</FieldGroup>
								<datalist id={`${id}-timezones`}>
									{timezones.map((zone) => (
										<option key={zone} value={zone} />
									))}
								</datalist>
								<FormInput
									name="emailCount"
									label="Emails to scan (required)"
									type="number"
									min={1}
									max={100}
									step={1}
									required
									disabled={isSubmitting}
									description="Scan the newest emails since your last successful brief, up to this limit. Includes read and unread mail, with your filing exclusions applied. The first brief uses your latest emails."
									className="max-w-md"
								/>
							</CollapsibleContent>
						</Collapsible>
					</FieldGroup>
					<aside
						aria-label="About this routine"
						className="flex min-w-0 flex-col gap-6 border-t pt-6 lg:col-span-2 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
					>
						<div className="flex flex-col gap-2">
							<H3 className="flex items-center gap-2 text-base">
								<CalendarClock
									className="size-4"
									aria-hidden="true"
								/>
								Next brief
							</H3>
							<P className="text-sm">
								{nextRun ??
									(routine.enabled
										? "Waiting for the scheduler."
										: "Enable the brief when you're ready.")}
							</P>
							{nextRun && (
								<Small className="break-words text-muted-foreground">
									{routine.timezone.replaceAll("_", " ")}
								</Small>
							)}
						</div>
						<div className="flex items-start gap-2 text-muted-foreground">
							<LockKeyhole
								className="mt-0.5 size-4 shrink-0"
								aria-hidden="true"
							/>
							<Small className="leading-relaxed">
								Your brief stays here in Routines. This routine
								reads your inbox; it does not send or change
								emails.
							</Small>
						</div>
					</aside>
				</CardContent>
				{!isAvailable && (
					<div className="px-6 pb-6">
						<Alert>
							<AlertTitle>Setup needs attention</AlertTitle>
							<AlertDescription>
								{availabilityMessage ||
									"Your inbox connection, scheduler, or assistant is unavailable. Check your connection or contact your administrator."}
								{!routine.mailboxAvailable && (
									<Button
										asChild
										variant="link"
										className="h-auto self-start p-0"
									>
										<Link to="/brain/sources">
											Manage inbox connection
										</Link>
									</Button>
								)}
							</AlertDescription>
						</Alert>
					</div>
				)}
				{errors.root?.server?.message && (
					<div className="px-6 pb-6">
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					</div>
				)}
				<CardFooter className="flex-wrap justify-between gap-4 border-t py-4">
					<Small className="text-muted-foreground">
						<output>
							{isDirty
								? "You have unsaved changes."
								: routine.enabled
									? "Your schedule is saved."
									: "Off until you choose to enable it."}
						</output>
					</Small>
					<FormActions
						isSubmitting={isSubmitting}
						onCancel={() => form.reset(formValues(routine))}
						submitLabel={
							isSubmitting
								? "Saving…"
								: enabled
									? "Save schedule"
									: "Save preferences"
						}
						className="w-full sm:w-auto"
					/>
				</CardFooter>
			</Form>
		</Card>
	);
}
