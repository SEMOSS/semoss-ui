import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldSet,
	Input,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import { useSettings } from "@/hooks";
import {
	DaysOfWeek,
	FrequencyOptions,
	JobTypeOptions,
	Months,
	timezones,
} from "./job.constants";
import type { JobBuilder } from "./job.types";
import { getEncodeByJobType } from "./job.utils";

const emptyBuilder: JobBuilder = {
	formType: "",
	id: null,
	name: "",
	pixel: "",
	basicTz: "",
	tags: [],
	cronExpression: "0 0 12 * * ?",
	cronTz: "",
	smtpHost: "",
	smtpPort: "",
	subject: "",
	jobType: "",
	to: [],
	cc: [],
	bcc: [],
	from: "",
	message: "",
	username: "",
	password: "",
};

export const AddNewJob = () => {
	const { adminMode } = useSettings();
	const location = useLocation();
	const navigate = useNavigate();
	const initialBuilderFromLocation = (
		location.state as { initialState?: JobBuilder } | undefined
	)?.initialState;
	const [builder, setBuilder] = useState<JobBuilder>(
		initialBuilderFromLocation ?? emptyBuilder,
	);
	const [timeZoneType, setTimeZoneType] = useState("Standard");
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	const setBuilderField = (field: string, value: string | string[]) => {
		setBuilder((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const addJob = async () => {
		try {
			const encode = getEncodeByJobType(builder);
			const response = await runPixel(
				`META|ScheduleJob(jobName=["${builder.name}"],${
					builder.tags.length
						? ` jobTags=${JSON.stringify(builder.tags)},`
						: ""
				} jobGroup=["defaultGroup"], cronExpression=["${builder.cronExpression}"], cronTz=["${builder.cronTz}"], recipe=["<encode>${encode}</encode>"], uiState='{"jobType":"${builder.jobType}","jobName":"${builder.name}", "cronExpression":"${builder.cronExpression}","cronTimeZone":"${builder.cronTz}", "recipeParameters":""}',triggerOnLoad=[false],triggerNow=[false]);`,
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
			const encode = getEncodeByJobType(builder);
			const response = await runPixel(
				`META|EditScheduledJob(jobId="${builder.id}",jobName="${
					builder.name
				}",${
					builder.tags.length
						? `jobTags=${JSON.stringify(builder.tags)},`
						: ""
				}jobGroup=["defaultGroup"],cronExpression="${builder.cronExpression} *",cronTz="${builder.cronTz}",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${builder.jobType}", "jobName":"${builder.name}", "cronExpression":"${builder.cronExpression}", "cronTimeZone":"${builder.cronTz}"}',triggerOnLoad=[false],triggerNow=[false]);`,
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
		<div className="space-y-2">
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
			<FieldSet>
				<Field className="flex flex-row items-start gap-4">
					<div className="w-1/4">
						<FieldLabel className="mb-2">
							Select Time Zone
						</FieldLabel>
						<FieldDescription>
							Please select the time zone for the job you are
							adding.
						</FieldDescription>
					</div>
					<div className="flex w-3/4 flex-col">
						<RadioGroup
							name="timeZone"
							value={timeZoneType}
							onValueChange={(value) => {
								setBuilderField("basicTz", value);
								setTimeZoneType(value);
							}}
							className="flex flex-row gap-4"
						>
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="Standard"
									id={"standard"}
									data-testid="standard"
								/>
								<label
									htmlFor="standard"
									className="cursor-pointer font-medium text-sm"
								>
									Standard
								</label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="Custom"
									id={"custom"}
									data-testid="custom"
								/>
								<label
									htmlFor="custom"
									className="cursor-pointer font-medium text-sm"
								>
									Custom
								</label>
							</div>
						</RadioGroup>
					</div>
				</Field>
			</FieldSet>
			<hr className="border-gray-300" />
			<FieldSet>
				<Field className="flex flex-row items-start gap-4">
					<div className="w-1/4">
						<FieldLabel className="mb-2">Job Details</FieldLabel>
						<FieldDescription>
							Kindly provide the name, type, pixel, and tags to
							proceed with adding the new job.
						</FieldDescription>
					</div>
					<div className="w-3/4">
						<JobDetails
							builder={builder}
							setBuilderField={setBuilderField}
						/>
					</div>
				</Field>
			</FieldSet>
			<hr className="border-gray-300" />
			<FieldSet>
				<Field className="flex flex-row items-start gap-4">
					<div className="w-1/4">
						<FieldLabel className="mb-2">Job Time</FieldLabel>
						<FieldDescription>
							Kindly provide the Time zone, Frequency, and time to
							proceed with adding the new job.
						</FieldDescription>
					</div>
					<div className="w-3/4">
						<JobTimeZone
							builder={builder}
							setBuilderField={setBuilderField}
							jobType={timeZoneType}
						/>
					</div>
				</Field>
			</FieldSet>
			<div className="mt-6 flex justify-end gap-4 pb-5">
				<Button
					variant="outline"
					onClick={() => navigate("/settings/jobs")}
				>
					Back
				</Button>
				<Button
					variant="default"
					onClick={builder.formType === "edit" ? updateJob : addJob}
				>
					{builder.formType === "edit" ? "Update Job" : "Add Job"}
				</Button>
			</div>
		</div>
	);
};

const JobDetails = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
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
			<div className="flex gap-5">
				<Field className="w-full">
					<FieldLabel>Name</FieldLabel>
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

				<Field className="w-full">
					<FieldLabel>Type</FieldLabel>
					<FieldContent>
						<Select
							value={builder.jobType ?? undefined}
							onValueChange={(value) =>
								setBuilderField("jobType", value)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Job Type" />
							</SelectTrigger>
							<SelectContent>
								{JobTypeOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldContent>
				</Field>
			</div>

			<Field>
				<FieldLabel>Pixel</FieldLabel>
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

type JobTimeZoneBuilder = JobBuilder & {
	frequency?: string | null;
};

const JobTimeZone = (props: {
	builder: JobTimeZoneBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
	jobType: string;
}) => {
	const { builder, setBuilderField, jobType } = props;

	const [selected, setSelected] = useState("semossStart");
	const [time, setTime] = useState("12:00");

	const [cronMinute, setCronMinute] = useState("0");
	const [cronHour, setCronHour] = useState("12");
	const [cronDayOfMonth, setCronDayOfMonth] = useState("*");
	const [cronMonth, setCronMonth] = useState("*");
	const [cronDayOfWeek, setCronDayOfWeek] = useState("?");

	const minutes = Array.from({ length: 60 }, (_, i) => `${i + 1}`);
	const hours = Array.from({ length: 24 }, (_, i) => `${i + 1}`);
	const daysOfMonth = Array.from({ length: 31 }, (_, i) => `${i + 1}`);

	useEffect(() => {
		const cronValues = builder.cronExpression.split(" ");
		if (cronValues.length < 6) return;

		setCronMinute(cronValues[1] ?? "0");
		setCronHour(cronValues[2] ?? "12");
		setCronMonth(cronValues[4] ?? "*");

		const dayOfMonth = cronValues[3];
		const dayOfWeek = cronValues[5];

		if (dayOfMonth && dayOfMonth !== "*" && dayOfMonth !== "?") {
			setCronDayOfMonth(dayOfMonth);
			setCronDayOfWeek("?");
		} else if (dayOfWeek && dayOfWeek !== "*" && dayOfWeek !== "?") {
			setCronDayOfWeek(dayOfWeek);
			setCronDayOfMonth("?");
		} else {
			setCronDayOfMonth(dayOfMonth || "*");
			setCronDayOfWeek(dayOfWeek || "?");
		}
	}, []);

	useEffect(() => {
		setBuilderField(
			"cronExpression",
			`0 ${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek}`,
		);
	}, [cronMinute, cronHour, cronDayOfMonth, cronMonth, cronDayOfWeek]);

	return (
		<div className="flex flex-col gap-6">
			{jobType === "Standard" && (
				<>
					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>Time Zone</FieldLabel>
							<FieldContent>
								<Select
									value={builder.cronTz}
									onValueChange={(v) =>
										setBuilderField("cronTz", v)
									}
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

						<Field className="w-full">
							<FieldLabel>Frequency</FieldLabel>
							<FieldContent>
								<Select
									value={builder.frequency ?? undefined}
									onValueChange={(v) =>
										setBuilderField("frequency", v)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select Frequency" />
									</SelectTrigger>
									<SelectContent>
										{FrequencyOptions.map((f: string) => (
											<SelectItem key={f} value={f}>
												{f.replaceAll("_", " ")}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>

					<Field>
						<FieldLabel>Time</FieldLabel>
						<FieldContent>
							<Input
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
							/>
						</FieldContent>
					</Field>
				</>
			)}

			{jobType === "Custom" && (
				<Field>
					<FieldLabel>Schedule Type</FieldLabel>
					<FieldContent>
						<RadioGroup
							value={selected}
							onValueChange={setSelected}
						>
							<div className="flex gap-6">
								<div className="flex items-center gap-2">
									<RadioGroupItem value="dropdown" />
									<span>Use Dropdown For Schedule</span>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem value="Custom" />
									<span>Custom Cron Expression</span>
								</div>
							</div>

							<div className="mt-2 flex items-center gap-2">
								<RadioGroupItem value="semossStart" />
								<span>
									Execute Jobs Each Time Semoss Starts
								</span>
							</div>
						</RadioGroup>
					</FieldContent>
				</Field>
			)}

			{selected === "dropdown" && jobType === "Custom" && (
				<div className="flex flex-col gap-5">
					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>Time Zone</FieldLabel>
							<FieldContent>
								<Select
									value={builder.cronTz}
									onValueChange={(v) =>
										setBuilderField("cronTz", v)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select Timezone" />
									</SelectTrigger>
									<SelectContent>
										{timezones.map((tz: string) => (
											<SelectItem key={tz} value={tz}>
												{tz}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>

						<Field className="w-full">
							<FieldLabel>Minute</FieldLabel>
							<FieldContent>
								<Select
									value={cronMinute}
									onValueChange={(v) => setCronMinute(v)}
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
							<FieldLabel>Hour</FieldLabel>
							<FieldContent>
								<Select
									value={cronHour}
									onValueChange={setCronHour}
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
							<FieldLabel>Day of Month</FieldLabel>
							<FieldContent>
								<Select
									value={cronDayOfMonth}
									onValueChange={(v) => {
										setCronDayOfMonth(v);
										if (v !== "*") setCronDayOfWeek("?");
									}}
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

					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>Month</FieldLabel>
							<FieldContent>
								<Select
									value={cronMonth}
									onValueChange={(v) => setCronMonth(v)}
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
							<FieldLabel>Day of Week</FieldLabel>
							<FieldContent>
								<Select
									value={cronDayOfWeek}
									onValueChange={(v) => {
										setCronDayOfWeek(v);
										setCronDayOfMonth("?");
									}}
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
					</div>
				</div>
			)}

			{selected === "Custom" && jobType === "Custom" && (
				<div className="flex flex-col gap-5">
					<Field>
						<FieldLabel>Cron Time Zone</FieldLabel>
						<FieldContent>
							<Select
								value={builder.cronTz}
								onValueChange={(v) =>
									setBuilderField("cronTz", v)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Timezone" />
								</SelectTrigger>
								<SelectContent>
									{timezones.map((tz: string) => (
										<SelectItem key={tz} value={tz}>
											{tz}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>

					<Field>
						<FieldLabel>Cron Expression</FieldLabel>
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
