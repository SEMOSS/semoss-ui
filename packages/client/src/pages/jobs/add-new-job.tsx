import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	FieldSet,
	RadioGroup,
	RadioGroupItem,
} from "@semoss/ui/next"; // Updated imports
import { useSettings } from "@/hooks";
import { AddPixelModal } from "./AddPixelModal";
import { JobDetailsModel } from "./JobDetailsModel";
import { JobTimeZoneModel } from "./JobTimeZoneModel";
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
	const [pixelOpen, setPixelOpen] = useState(false);
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
		<div className="space-y-8">
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
						<JobDetailsModel
							builder={builder}
							setBuilderField={setBuilderField}
							setPixelOpen={setPixelOpen}
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
						<JobTimeZoneModel
							builder={builder}
							setBuilderField={setBuilderField}
							jobType={timeZoneType}
						/>
					</div>
				</Field>
			</FieldSet>
			<hr className="border-gray-300" />
			<div className="mt-6 flex justify-end gap-4">
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
			{pixelOpen && (
				<AddPixelModal
					isOpen={pixelOpen}
					setPixelOpen={setPixelOpen}
					builder={builder}
					setBuilderField={setBuilderField}
				/>
			)}
		</div>
	);
};
