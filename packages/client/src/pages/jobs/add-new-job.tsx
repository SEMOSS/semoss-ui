import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Checkbox,
	Field,
	FieldContent,
	FieldLabel,
	H4,
	Input,
	Muted,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Textarea,
} from "@semoss/ui/next";
import { useRootStore, useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { getTagBadgeStyle } from "@/utility";
import {
	DaysOfWeek,
	FrequencyOptions,
	Months,
	timezones,
} from "./job.constants";
import type { Frequencies, JobBuilder } from "./job.types";
import { buildCron, buildStandardCron, parseCron } from "./job.utils";

const RequiredMark = () => <span className="text-destructive">*</span>;

const getBrowserTimeZone = (): string => {
	try {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return tz && timezones.includes(tz) ? tz : "";
	} catch {
		return "";
	}
};

const emptyBuilder: JobBuilder = {
	formType: "",
	id: null,
	name: "",
	pixel: "",
	tags: [],
	cronExpression: "0 0 12 * * ?",
	cronTz: "",
	triggerOnLoad: false,
};

export const AddNewJob = () => {
	const { adminMode } = useSettings();
	const { configStore } = useRootStore();
	const themeName = configStore.theme.name?.trim() || "SEMOSS";
	const location = useLocation();
	const navigate = useNavigate();
	const initialBuilderFromLocation = (
		location.state as { initialState?: JobBuilder } | undefined
	)?.initialState;
	const [builder, setBuilder] = useState<JobBuilder>(() =>
		initialBuilderFromLocation
			? initialBuilderFromLocation
			: { ...emptyBuilder, cronTz: getBrowserTimeZone() },
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: initial cron parse only — picks default tab on mount
	const initialMode = useMemo(
		() => parseCron(builder.cronExpression).mode,
		[],
	);
	const [scheduleType, setScheduleType] = useState<"Standard" | "Custom">(
		initialMode === "standard" ? "Standard" : "Custom",
	);
	const [customMode, setCustomMode] = useState<"dropdown" | "expression">(
		initialMode === "expression" ? "expression" : "dropdown",
	);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const scheduleStandardId = useId();
	const scheduleCustomId = useId();
	const triggerOnLoadId = useId();

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	const setBuilderField = (
		field: keyof JobBuilder,
		value: string | string[] | boolean,
	) => {
		setBuilder((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const addJob = async () => {
		try {
			const response = await runPixel(
				`META|ScheduleJob(jobName=["${builder.name}"],${
					builder.tags.length
						? ` jobTags=${JSON.stringify(builder.tags)},`
						: ""
				} jobGroup=["defaultGroup"], cronExpression=["${builder.cronExpression}"], cronTz=["${builder.cronTz}"], recipe=["<encode>${builder.pixel}</encode>"], triggerOnLoad=[${builder.triggerOnLoad}], triggerNow=[false]);`,
			);
			if (response.errors.length) {
				throw new Error(response.errors[0]);
			}
			navigate("/settings/jobs");
			setNotification({
				type: "success",
				message: "Job added successfully",
			});
		} catch {
			setNotification({ type: "error", message: "Unable to add job" });
		}
	};

	const updateJob = async () => {
		try {
			const response = await runPixel(
				`META|EditScheduledJob(jobId="${builder.id}",jobName="${
					builder.name
				}",${
					builder.tags.length
						? `jobTags=${JSON.stringify(builder.tags)},`
						: ""
				}jobGroup=["defaultGroup"],cronExpression="${builder.cronExpression}",cronTz="${builder.cronTz}",recipe="<encode>${builder.pixel}</encode>",triggerOnLoad=[${builder.triggerOnLoad}],triggerNow=[false]);`,
			);
			if (response.errors.length) {
				throw new Error(response.errors[0]);
			}
			navigate("/settings/jobs");
			setNotification({
				type: "success",
				message: "Job updated successfully",
			});
		} catch {
			setNotification({ type: "error", message: "Unable to update job" });
		}
	};

	return (
		<form
			className="my-4"
			onSubmit={(e) => {
				e.preventDefault();
				if (builder.formType === "edit") {
					updateJob();
				} else {
					addJob();
				}
			}}
			autoComplete="off"
		>
			{notification && (
				<Alert
					variant={
						notification.type === "success"
							? "default"
							: "destructive"
					}
					className="mb-4"
				>
					<AlertTitle>
						{notification.type === "success" ? "Success" : "Error"}
					</AlertTitle>
					<AlertDescription>{notification.message}</AlertDescription>
				</Alert>
			)}

			<div className="mb-4 flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
					<div className="flex flex-1 flex-col gap-1">
						<H4 className="font-semibold text-base tracking-tight">
							Schedule Type
						</H4>
						<Muted className="text-muted-foreground text-sm leading-6">
							Choose Standard for common frequencies, or Custom
							for full cron control.
						</Muted>
					</div>
					<div className="flex flex-[2] flex-col gap-2">
						<RadioGroup
							name="scheduleType"
							value={scheduleType}
							onValueChange={(value) =>
								setScheduleType(value as "Standard" | "Custom")
							}
							className="flex flex-row gap-4"
						>
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="Standard"
									id={scheduleStandardId}
									data-testid="standard"
								/>
								<label
									htmlFor={scheduleStandardId}
									className="cursor-pointer font-medium text-sm"
								>
									Standard
								</label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="Custom"
									id={scheduleCustomId}
									data-testid="custom"
								/>
								<label
									htmlFor={scheduleCustomId}
									className="cursor-pointer font-medium text-sm"
								>
									Custom
								</label>
							</div>
						</RadioGroup>
					</div>
				</div>
				<Separator />
			</div>

			<div className="mb-4 flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
					<div className="flex flex-1 flex-col gap-1">
						<H4 className="font-semibold text-base tracking-tight">
							Job Details
						</H4>
						<Muted className="text-muted-foreground text-sm leading-6">
							Provide the name, pixel, and tags for this job.
						</Muted>
					</div>
					<div className="flex flex-[2] flex-col gap-2">
						<JobDetails
							builder={builder}
							setBuilderField={setBuilderField}
						/>
					</div>
				</div>
				<Separator />
			</div>

			<div className="mb-4 flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
					<div className="flex flex-1 flex-col gap-1">
						<H4 className="font-semibold text-base tracking-tight">
							Job Time
						</H4>
						<Muted className="text-muted-foreground text-sm leading-6">
							Set the time zone and schedule for when this job
							runs.
						</Muted>
					</div>
					<div className="flex flex-[2] flex-col gap-2">
						<JobTimeZone
							builder={builder}
							setBuilderField={setBuilderField}
							scheduleType={scheduleType}
							customMode={customMode}
							setCustomMode={setCustomMode}
						/>
					</div>
				</div>
				<Separator />
			</div>

			<div className="mb-4 flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
					<div className="flex flex-1 flex-col gap-1">
						<H4 className="font-semibold text-base tracking-tight">
							Run on Startup
						</H4>
						<Muted className="text-muted-foreground text-sm leading-6">
							In addition to the schedule above, also execute this
							job each time {themeName} starts.
						</Muted>
					</div>
					<div className="flex flex-[2] flex-col gap-2">
						<div className="flex items-center gap-2">
							<Checkbox
								id={triggerOnLoadId}
								checked={builder.triggerOnLoad}
								onCheckedChange={(checked) =>
									setBuilderField(
										"triggerOnLoad",
										checked === true,
									)
								}
							/>
							<label
								htmlFor={triggerOnLoadId}
								className="cursor-pointer font-medium text-sm"
							>
								Execute on {themeName} startup
							</label>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={() => navigate("/settings/jobs")}
					className="flex w-full items-center justify-center gap-2 px-4 py-2 sm:w-[147px]"
				>
					Back
				</Button>
				<Button
					type="submit"
					variant="default"
					className="flex w-full items-center justify-center gap-2 px-4 py-2 sm:w-[147px]"
				>
					{builder.formType === "edit" ? "Update Job" : "Add Job"}
				</Button>
			</div>
		</form>
	);
};

const JobDetails = (props: {
	builder: JobBuilder;
	setBuilderField: (
		field: keyof JobBuilder,
		value: string | string[] | boolean,
	) => void;
}) => {
	const { builder, setBuilderField } = props;
	const [tagInput, setTagInput] = useState("");
	const tags = (builder.tags as string[]) ?? [];

	const addTag = () => {
		const trimmed = tagInput.trim();
		if (!trimmed) {
			return;
		}

		if (!tags.includes(trimmed)) {
			setBuilderField("tags", [...tags, trimmed]);
		}

		setTagInput("");
	};

	return (
		<div className="flex flex-col gap-6">
			<Field>
				<FieldLabel>
					Name <RequiredMark />
				</FieldLabel>
				<FieldContent>
					<Input
						placeholder="Enter the Name"
						value={builder.name}
						onChange={(e) =>
							setBuilderField("name", e.target.value)
						}
					/>
				</FieldContent>
			</Field>

			<Field>
				<FieldLabel>
					Pixel <RequiredMark />
				</FieldLabel>
				<FieldContent>
					<div className="relative w-full cursor-pointer">
						<Textarea
							placeholder="Enter Pixel"
							value={builder.pixel}
							onChange={(e) =>
								setBuilderField("pixel", e.target.value)
							}
							rows={3}
						/>
					</div>
				</FieldContent>
			</Field>

			<Field>
				<FieldLabel>Tags</FieldLabel>
				<FieldContent>
					<Input
						value={tagInput}
						placeholder='Press "Enter" to add tag'
						onChange={(e) => setTagInput(e.target.value)}
						onBlur={addTag}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === ",") {
								e.preventDefault();
								addTag();
							}
						}}
					/>
					{!!tags.length && (
						<div className="mt-2 flex flex-wrap gap-1">
							{tags.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="gap-1"
									style={getTagBadgeStyle(tag)}
								>
									{tag}
									<button
										type="button"
										onClick={() =>
											setBuilderField(
												"tags",
												tags.filter((t) => t !== tag),
											)
										}
										className="hover:text-destructive"
										aria-label={`Remove ${tag} tag`}
									>
										<X className="size-3" />
									</button>
								</Badge>
							))}
						</div>
					)}
				</FieldContent>
			</Field>
		</div>
	);
};

const isWildcard = (val: string) => val === "*" || val === "?";

const JobTimeZone = (props: {
	builder: JobBuilder;
	setBuilderField: (
		field: keyof JobBuilder,
		value: string | string[] | boolean,
	) => void;
	scheduleType: "Standard" | "Custom";
	customMode: "dropdown" | "expression";
	setCustomMode: (mode: "dropdown" | "expression") => void;
}) => {
	const {
		builder,
		setBuilderField,
		scheduleType,
		customMode,
		setCustomMode,
	} = props;

	const dropdownModeId = useId();
	const expressionModeId = useId();

	const parsed = parseCron(builder.cronExpression);

	const minutes = Array.from({ length: 60 }, (_, i) => `${i}`);
	const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
	const daysOfMonth = Array.from({ length: 31 }, (_, i) => `${i + 1}`);

	const TimeZoneSelect = (
		<Field className="w-full">
			<FieldLabel>
				Time Zone <RequiredMark />
			</FieldLabel>
			<FieldContent>
				<Select
					value={builder.cronTz}
					onValueChange={(v) => setBuilderField("cronTz", v)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select Timezone" />
					</SelectTrigger>
					<SelectContent>
						{timezones.map((tz: string) => (
							<SelectItem key={tz} value={tz}>
								{tz.replaceAll("_", " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FieldContent>
		</Field>
	);

	if (scheduleType === "Standard") {
		const frequency: Frequencies = parsed.frequency ?? "Daily";
		const timeValue = `${parsed.hour.padStart(2, "0")}:${parsed.minute.padStart(2, "0")}`;

		const rebuildStandard = (next: {
			frequency?: Frequencies;
			hour?: string;
			minute?: string;
			dayOfWeek?: string;
			dayOfMonth?: string;
			month?: string;
		}) => {
			const freq = next.frequency ?? frequency;
			const hour = next.hour ?? parsed.hour;
			const minute = next.minute ?? parsed.minute;
			const dayOfWeek =
				next.dayOfWeek ??
				(isWildcard(parsed.dayOfWeek) ? "0" : parsed.dayOfWeek);
			const dayOfMonth =
				next.dayOfMonth ??
				(isWildcard(parsed.dayOfMonth) ? "1" : parsed.dayOfMonth);
			const month =
				next.month ?? (parsed.month === "*" ? "1" : parsed.month);
			setBuilderField(
				"cronExpression",
				buildStandardCron(freq, hour, minute, {
					dayOfWeek,
					dayOfMonth,
					month,
				}),
			);
		};

		const handleTimeChange = (value: string) => {
			const [h, m] = value.split(":");
			if (h === undefined || m === undefined) return;
			rebuildStandard({
				hour: String(parseInt(h, 10)),
				minute: String(parseInt(m, 10)),
			});
		};

		return (
			<div className="flex flex-col gap-6">
				<div className="flex gap-5">
					{TimeZoneSelect}

					<Field className="w-full">
						<FieldLabel>
							Frequency <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Select
								value={frequency}
								onValueChange={(v) =>
									rebuildStandard({
										frequency: v as Frequencies,
									})
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Frequency" />
								</SelectTrigger>
								<SelectContent>
									{FrequencyOptions.map((f: string) => (
										<SelectItem key={f} value={f}>
											{f}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>
				</div>

				<Field>
					<FieldLabel>
						Time <RequiredMark />
					</FieldLabel>
					<FieldContent>
						<Input
							type="time"
							value={timeValue}
							onChange={(e) => handleTimeChange(e.target.value)}
						/>
					</FieldContent>
				</Field>

				{frequency === "Weekly" && (
					<Field>
						<FieldLabel>
							Day of Week <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Select
								value={
									isWildcard(parsed.dayOfWeek)
										? "0"
										: parsed.dayOfWeek
								}
								onValueChange={(v) =>
									rebuildStandard({ dayOfWeek: v })
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Day" />
								</SelectTrigger>
								<SelectContent>
									{DaysOfWeek.map((d) => (
										<SelectItem
											key={d.value}
											value={`${d.value}`}
										>
											{d.day}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>
				)}

				{frequency === "Monthly" && (
					<Field>
						<FieldLabel>
							Day of Month <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Select
								value={
									isWildcard(parsed.dayOfMonth)
										? "1"
										: parsed.dayOfMonth
								}
								onValueChange={(v) =>
									rebuildStandard({ dayOfMonth: v })
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Day" />
								</SelectTrigger>
								<SelectContent>
									{daysOfMonth.map((d) => (
										<SelectItem key={d} value={d}>
											{d}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>
				)}

				{frequency === "Yearly" && (
					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>
								Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										parsed.month === "*"
											? "1"
											: parsed.month
									}
									onValueChange={(v) =>
										rebuildStandard({ month: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Month" />
									</SelectTrigger>
									<SelectContent>
										{Months.map((m) => (
											<SelectItem
												key={m.value}
												value={`${m.value}`}
											>
												{m.month}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
						<Field className="w-full">
							<FieldLabel>
								Day of Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										isWildcard(parsed.dayOfMonth)
											? "1"
											: parsed.dayOfMonth
									}
									onValueChange={(v) =>
										rebuildStandard({ dayOfMonth: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Day" />
									</SelectTrigger>
									<SelectContent>
										{daysOfMonth.map((d) => (
											<SelectItem key={d} value={d}>
												{d}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>
				)}
			</div>
		);
	}

	const rebuildDropdown = (next: Partial<typeof parsed>) => {
		const merged = {
			minute: parsed.minute,
			hour: parsed.hour,
			dayOfMonth: parsed.dayOfMonth,
			month: parsed.month,
			dayOfWeek: parsed.dayOfWeek,
			...next,
		};
		if (next.dayOfMonth && !isWildcard(next.dayOfMonth)) {
			merged.dayOfWeek = "?";
		}
		if (next.dayOfWeek && !isWildcard(next.dayOfWeek)) {
			merged.dayOfMonth = "?";
		}
		setBuilderField("cronExpression", buildCron(merged));
	};

	return (
		<div className="flex flex-col gap-6">
			<Field>
				<FieldLabel>Schedule Builder</FieldLabel>
				<FieldContent>
					<RadioGroup
						value={customMode}
						onValueChange={(v) =>
							setCustomMode(v as "dropdown" | "expression")
						}
					>
						<div className="flex gap-6">
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="dropdown"
									id={dropdownModeId}
								/>
								<label
									htmlFor={dropdownModeId}
									className="cursor-pointer text-sm"
								>
									Use Dropdown For Schedule
								</label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="expression"
									id={expressionModeId}
								/>
								<label
									htmlFor={expressionModeId}
									className="cursor-pointer text-sm"
								>
									Custom Cron Expression
								</label>
							</div>
						</div>
					</RadioGroup>
				</FieldContent>
			</Field>

			{customMode === "dropdown" && (
				<div className="flex flex-col gap-5">
					<div className="flex gap-5">
						{TimeZoneSelect}

						<Field className="w-full">
							<FieldLabel>
								Minute <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										minutes.includes(parsed.minute)
											? parsed.minute
											: undefined
									}
									onValueChange={(v) =>
										rebuildDropdown({ minute: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Minute" />
									</SelectTrigger>
									<SelectContent>
										{minutes.map((m) => (
											<SelectItem key={m} value={m}>
												{m}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>

					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>
								Hour <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										hours.includes(parsed.hour)
											? parsed.hour
											: undefined
									}
									onValueChange={(v) =>
										rebuildDropdown({ hour: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Hour" />
									</SelectTrigger>
									<SelectContent>
										{hours.map((h) => (
											<SelectItem key={h} value={h}>
												{h}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>

						<Field className="w-full">
							<FieldLabel>
								Day of Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										isWildcard(parsed.dayOfMonth)
											? "*"
											: daysOfMonth.includes(
														parsed.dayOfMonth,
													)
												? parsed.dayOfMonth
												: undefined
									}
									onValueChange={(v) =>
										rebuildDropdown({ dayOfMonth: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Day" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="*">Any</SelectItem>
										{daysOfMonth.map((d) => (
											<SelectItem key={d} value={d}>
												{d}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>

					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>
								Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={parsed.month}
									onValueChange={(v) =>
										rebuildDropdown({ month: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Month" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="*">Any</SelectItem>
										{Months.map((m) => (
											<SelectItem
												key={m.value}
												value={`${m.value}`}
											>
												{m.month}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>

						<Field className="w-full">
							<FieldLabel>
								Day of Week <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										isWildcard(parsed.dayOfWeek)
											? "?"
											: parsed.dayOfWeek
									}
									onValueChange={(v) =>
										rebuildDropdown({ dayOfWeek: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Day" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="?">Any</SelectItem>
										{DaysOfWeek.map((d) => (
											<SelectItem
												key={d.value}
												value={`${d.value}`}
											>
												{d.day}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>
				</div>
			)}

			{customMode === "expression" && (
				<div className="flex flex-col gap-5">
					{TimeZoneSelect}

					<Field>
						<FieldLabel>
							Cron Expression <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Textarea
								rows={3}
								value={builder.cronExpression}
								onChange={(e) =>
									setBuilderField(
										"cronExpression",
										e.target.value,
									)
								}
							/>
						</FieldContent>
					</Field>
				</div>
			)}
		</div>
	);
};
