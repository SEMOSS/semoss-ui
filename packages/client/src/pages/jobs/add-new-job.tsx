import { useId, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Checkbox,
	H4,
	Muted,
	RadioGroup,
	RadioGroupItem,
	Separator,
} from "@semoss/ui/next";
import { usePlatformTheme } from "@/hooks/use-platform-theme";
import { useNavigate } from "@/hooks/useNavigate";
import { useSettings } from "@/hooks/useSettings";
import { timezones } from "./job.constants";
import type { JobBuilder } from "./job.types";
import { parseCron } from "./job.utils";
import { JobDetails } from "./job-details";
import { JobTimeZone } from "./job-time-zone";

/** The browser's time zone, when it is one the scheduler offers. */
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

/**
 * Admin page to add a scheduled job, or edit the one passed in the location's
 * `initialState`. Outside admin mode it sends the user back to Settings.
 */
export const AddNewJob = () => {
	const { adminMode } = useSettings();
	const themeName = usePlatformTheme().name?.trim() || "SEMOSS";
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
				} jobGroup=["defaultGroup"], cronExpression=["${builder.cronExpression}"], cronTz=["${builder.cronTz}"], recipe=["<encode>${encodeURIComponent(builder.pixel)}</encode>"], triggerOnLoad=[${builder.triggerOnLoad}], triggerNow=[false]);`,
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
				}jobGroup=["defaultGroup"],cronExpression="${builder.cronExpression}",cronTz="${builder.cronTz}",recipe="<encode>${encodeURIComponent(builder.pixel)}</encode>",triggerOnLoad=[${builder.triggerOnLoad}],triggerNow=[false]);`,
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
