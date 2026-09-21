import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Form,
	FormActions,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormTextarea,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	type AgentSchedule,
	type AgentScheduleInput,
	createAgentSchedule,
	manageAgentSchedule,
} from "@/api";
import type { App, Engine } from "@/types";
import { SearchableSelectField } from "./searchable-select-field";
import { TimeZoneField } from "./time-zone-field";

const NONE = "__none__";

const REPEAT_FREQUENCIES = [
	"DAILY",
	"WEEKDAYS",
	"WEEKLY",
	"MONTHLY",
	"CUSTOM",
] as const;

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

const WEEK_DAY_OPTIONS = [
	{ value: "MON", label: "Monday" },
	{ value: "TUE", label: "Tuesday" },
	{ value: "WED", label: "Wednesday" },
	{ value: "THU", label: "Thursday" },
	{ value: "FRI", label: "Friday" },
	{ value: "SAT", label: "Saturday" },
	{ value: "SUN", label: "Sunday" },
] as const;

const schema = z.object({
	name: z.string(),
	prompt: z.string().min(1, "Instructions are required"),
	agentId: z.string(),
	modelId: z.string(),
	scheduleType: z.enum(["ONCE", "RECURRING"]),
	runAt: z.string(),
	repeatFrequency: z.enum(REPEAT_FREQUENCIES),
	repeatTime: z.string(),
	repeatDayOfWeek: z.enum(WEEK_DAYS),
	repeatDayOfMonth: z.string(),
	cronExpression: z.string(),
	timezone: z.string().min(1, "Choose a time zone"),
	roomMode: z.enum(["FRESH", "CONTINUE"]),
	continuingRoomId: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface AgentScheduleFormProps {
	open: boolean;
	schedule?: AgentSchedule | null;
	onSubmit: (id?: string) => void;
}

interface PlaygroundRoomOption {
	ROOM_ID: string;
	ROOM_NAME?: string;
}

type RepeatFrequency = (typeof REPEAT_FREQUENCIES)[number];

interface RepeatSchedule {
	frequency: RepeatFrequency;
	time: string;
	dayOfWeek: (typeof WEEK_DAYS)[number];
	dayOfMonth: string;
}

const defaultRunAt = () => {
	const date = new Date(Date.now() + 60 * 60 * 1000);
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
};

const parseRepeatSchedule = (
	cronExpression?: string | null,
): RepeatSchedule => {
	const parts = cronExpression?.trim().split(/\s+/) ?? [];
	const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = parts;
	const validTime =
		seconds === "0" &&
		/^\d{1,2}$/.test(minutes ?? "") &&
		/^\d{1,2}$/.test(hours ?? "") &&
		Number(minutes) < 60 &&
		Number(hours) < 24;
	const time = validTime
		? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
		: "09:00";

	if (validTime && month === "*") {
		if (dayOfMonth === "*" && dayOfWeek === "?") {
			return {
				frequency: "DAILY",
				time,
				dayOfWeek: "MON",
				dayOfMonth: "1",
			};
		}
		if (dayOfMonth === "?" && dayOfWeek === "MON-FRI") {
			return {
				frequency: "WEEKDAYS",
				time,
				dayOfWeek: "MON",
				dayOfMonth: "1",
			};
		}
		if (
			dayOfMonth === "?" &&
			WEEK_DAYS.includes(dayOfWeek as (typeof WEEK_DAYS)[number])
		) {
			return {
				frequency: "WEEKLY",
				time,
				dayOfWeek: dayOfWeek as (typeof WEEK_DAYS)[number],
				dayOfMonth: "1",
			};
		}
		if (
			dayOfWeek === "?" &&
			/^\d{1,2}$/.test(dayOfMonth ?? "") &&
			Number(dayOfMonth) >= 1 &&
			Number(dayOfMonth) <= 28
		) {
			return {
				frequency: "MONTHLY",
				time,
				dayOfWeek: "MON",
				dayOfMonth,
			};
		}
	}

	return { frequency: "CUSTOM", time, dayOfWeek: "MON", dayOfMonth: "1" };
};

const buildCronExpression = (values: FormValues) => {
	if (values.repeatFrequency === "CUSTOM") {
		return values.cronExpression.trim();
	}
	const [hours, minutes] = values.repeatTime.split(":");
	const prefix = `0 ${Number(minutes)} ${Number(hours)}`;
	switch (values.repeatFrequency) {
		case "DAILY":
			return `${prefix} * * ?`;
		case "WEEKDAYS":
			return `${prefix} ? * MON-FRI`;
		case "WEEKLY":
			return `${prefix} ? * ${values.repeatDayOfWeek}`;
		case "MONTHLY":
			return `${prefix} ${values.repeatDayOfMonth} * ?`;
	}
};

/** Create or edit a Playground RunAgent schedule. */
export const AgentScheduleForm = ({
	open,
	schedule,
	onSubmit,
}: AgentScheduleFormProps) => {
	const agents = usePixel<App[]>(
		open
			? 'META | MyProjects(projectType=["WORKSPACE"], limit=[200], offset=[0]);'
			: "",
		{ data: [] },
	);
	const models = usePixel<Engine[]>(
		open
			? 'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);'
			: "",
		{ data: [] },
	);
	const rooms = usePixel<PlaygroundRoomOption[]>(
		open
			? 'META | GetPlaygroundRooms(limit=200, offset=0, sort=["DESC"]);'
			: "",
		{ data: [] },
	);

	const values = useMemo<FormValues>(() => {
		const repeatSchedule = parseRepeatSchedule(schedule?.cronExpression);
		return {
			name: schedule?.name ?? "",
			prompt: schedule?.prompt ?? "",
			agentId: schedule?.agentId ?? NONE,
			modelId: schedule?.modelId ?? NONE,
			scheduleType: schedule?.scheduleType ?? "ONCE",
			runAt: schedule?.runAt ?? defaultRunAt(),
			repeatFrequency: repeatSchedule.frequency,
			repeatTime: repeatSchedule.time,
			repeatDayOfWeek: repeatSchedule.dayOfWeek,
			repeatDayOfMonth: repeatSchedule.dayOfMonth,
			cronExpression: schedule?.cronExpression ?? "0 0 9 ? * MON-FRI",
			timezone:
				schedule?.timezone ??
				Intl.DateTimeFormat().resolvedOptions().timeZone,
			roomMode: schedule?.roomMode ?? "FRESH",
			continuingRoomId: schedule?.continuingRoomId ?? NONE,
		};
	}, [schedule]);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		values,
	});
	const scheduleType = form.watch("scheduleType");
	const repeatFrequency = form.watch("repeatFrequency");
	const roomMode = form.watch("roomMode");
	const agentId = form.watch("agentId");
	const usesSavedAgent = agentId !== NONE;
	const agentOptions = useMemo(
		() => [
			{ value: NONE, label: "No saved agent" },
			...(agents.data ?? []).map((agent) => ({
				value: agent.project_id,
				label: agent.project_display_name || agent.project_name,
			})),
		],
		[agents.data],
	);
	const modelOptions = useMemo(
		() => [
			...(usesSavedAgent
				? [{ value: NONE, label: "Use saved agent's default model" }]
				: []),
			...(models.data ?? []).map((model) => ({
				value: model.engine_id,
				label: model.engine_display_name || model.engine_name,
			})),
		],
		[models.data, usesSavedAgent],
	);

	const handleSubmit = async (formValues: FormValues) => {
		form.clearErrors();
		let hasError = false;
		if (formValues.agentId === NONE && formValues.modelId === NONE) {
			form.setError("modelId", {
				message: "Choose a model when no saved agent is selected",
			});
			hasError = true;
		}
		if (formValues.scheduleType === "ONCE" && !formValues.runAt) {
			form.setError("runAt", { message: "Choose a date and time" });
			hasError = true;
		}
		if (
			formValues.scheduleType === "RECURRING" &&
			formValues.repeatFrequency !== "CUSTOM" &&
			!/^([01]\d|2[0-3]):[0-5]\d$/.test(formValues.repeatTime)
		) {
			form.setError("repeatTime", { message: "Choose a time" });
			hasError = true;
		}
		if (
			formValues.scheduleType === "RECURRING" &&
			formValues.repeatFrequency === "CUSTOM" &&
			!formValues.cronExpression.trim()
		) {
			form.setError("cronExpression", {
				message: "Enter an advanced schedule",
			});
			hasError = true;
		}
		if (
			formValues.roomMode === "CONTINUE" &&
			formValues.continuingRoomId === NONE
		) {
			form.setError("continuingRoomId", {
				message: "Choose a chat to continue",
			});
			hasError = true;
		}
		if (hasError) return;

		const input: AgentScheduleInput = {
			name: formValues.name,
			prompt: formValues.prompt,
			agentId: formValues.agentId === NONE ? "" : formValues.agentId,
			modelId: formValues.modelId === NONE ? "" : formValues.modelId,
			scheduleType: formValues.scheduleType,
			runAt:
				formValues.scheduleType === "ONCE"
					? formValues.runAt
					: undefined,
			cronExpression:
				formValues.scheduleType === "RECURRING"
					? buildCronExpression(formValues)
					: undefined,
			timezone: formValues.timezone,
			roomMode: formValues.roomMode,
			continuingRoomId:
				formValues.roomMode === "CONTINUE" &&
				formValues.continuingRoomId !== NONE
					? formValues.continuingRoomId
					: "",
		};

		try {
			const result = schedule
				? await manageAgentSchedule(
						schedule.scheduleId,
						"UPDATE",
						input,
					)
				: await createAgentSchedule(input);
			const id = "scheduleId" in result ? result.scheduleId : undefined;
			toast.success(schedule ? "Changes saved" : "Task scheduled");
			onSubmit(id);
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to save the task",
			);
		}
	};

	const isLoadingOptions =
		agents.status === "LOADING" ||
		models.status === "LOADING" ||
		rooms.status === "LOADING";

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onSubmit()}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{schedule ? "Edit task" : "Schedule a task"}
					</DialogTitle>
					<DialogDescription>
						Choose what the agent should do, when it should run, and
						where to save the results.
					</DialogDescription>
				</DialogHeader>
				{isLoadingOptions ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : (
					<Form
						form={form}
						onSubmit={handleSubmit}
						className="flex flex-col gap-6"
					>
						<FormInput
							name="name"
							label="Name"
							placeholder="Weekly research summary"
							disabled={form.formState.isSubmitting}
						/>
						<FormTextarea
							name="prompt"
							label="Instructions"
							placeholder="Describe what you want the agent to do."
							disabled={form.formState.isSubmitting}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<SearchableSelectField
								name="agentId"
								label="Saved agent (optional)"
								description="Choose one to use its saved instructions, tools, and default model."
								placeholder="No saved agent"
								searchPlaceholder="Search saved agents…"
								emptyMessage="No saved agents found."
								options={agentOptions}
								disabled={form.formState.isSubmitting}
							/>
							<SearchableSelectField
								name="modelId"
								label={
									usesSavedAgent
										? "Model (optional)"
										: "Model (required)"
								}
								description={
									usesSavedAgent
										? "Choose a model to override the saved agent's default."
										: "Choose the model that will run this task."
								}
								placeholder="Select a model"
								searchPlaceholder="Search models…"
								emptyMessage="No models found."
								options={modelOptions}
								disabled={form.formState.isSubmitting}
							/>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<FormSelect
								name="scheduleType"
								label="Schedule"
								disabled={form.formState.isSubmitting}
							>
								<FormSelectItem value="ONCE">
									Once
								</FormSelectItem>
								<FormSelectItem value="RECURRING">
									Repeats
								</FormSelectItem>
							</FormSelect>
							<TimeZoneField
								disabled={form.formState.isSubmitting}
							/>
						</div>
						{scheduleType === "ONCE" ? (
							<FormInput
								name="runAt"
								type="datetime-local"
								label="Date and time"
								disabled={form.formState.isSubmitting}
							/>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								<FormSelect
									name="repeatFrequency"
									label="Repeats"
									disabled={form.formState.isSubmitting}
								>
									<FormSelectItem value="DAILY">
										Every day
									</FormSelectItem>
									<FormSelectItem value="WEEKDAYS">
										Weekdays
									</FormSelectItem>
									<FormSelectItem value="WEEKLY">
										Weekly
									</FormSelectItem>
									<FormSelectItem value="MONTHLY">
										Monthly
									</FormSelectItem>
									<FormSelectItem value="CUSTOM">
										Advanced
									</FormSelectItem>
								</FormSelect>
								{repeatFrequency !== "CUSTOM" && (
									<FormInput
										name="repeatTime"
										type="time"
										label="Time"
										disabled={form.formState.isSubmitting}
									/>
								)}
								{repeatFrequency === "WEEKLY" && (
									<FormSelect
										name="repeatDayOfWeek"
										label="Day"
										disabled={form.formState.isSubmitting}
									>
										{WEEK_DAY_OPTIONS.map((option) => (
											<FormSelectItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</FormSelectItem>
										))}
									</FormSelect>
								)}
								{repeatFrequency === "MONTHLY" && (
									<FormSelect
										name="repeatDayOfMonth"
										label="Day of the month"
										disabled={form.formState.isSubmitting}
									>
										{Array.from(
											{ length: 28 },
											(_, index) => {
												const day = String(index + 1);
												return (
													<FormSelectItem
														key={day}
														value={day}
													>
														{day}
													</FormSelectItem>
												);
											},
										)}
									</FormSelect>
								)}
								{repeatFrequency === "CUSTOM" && (
									<FormInput
										name="cronExpression"
										label="Cron expression"
										description="Advanced option for users who already work with cron schedules."
										disabled={form.formState.isSubmitting}
									/>
								)}
							</div>
						)}
						<FormSelect
							name="roomMode"
							label="Save results"
							disabled={form.formState.isSubmitting}
						>
							<FormSelectItem value="FRESH">
								Start a new chat for each run
							</FormSelectItem>
							<FormSelectItem value="CONTINUE">
								Continue in an existing chat
							</FormSelectItem>
						</FormSelect>
						{roomMode === "CONTINUE" && (
							<FormSelect
								name="continuingRoomId"
								label="Chat"
								disabled={form.formState.isSubmitting}
							>
								<FormSelectItem value={NONE}>
									Select a chat
								</FormSelectItem>
								{(rooms.data ?? []).map((room) => (
									<FormSelectItem
										key={room.ROOM_ID}
										value={room.ROOM_ID}
									>
										{room.ROOM_NAME || "Untitled chat"}
									</FormSelectItem>
								))}
							</FormSelect>
						)}
						<FormActions
							isSubmitting={form.formState.isSubmitting}
							onCancel={() => onSubmit()}
							submitLabel={
								schedule ? "Save changes" : "Schedule task"
							}
						/>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	);
};
