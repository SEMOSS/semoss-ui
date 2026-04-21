import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import {
	hasValidDays,
	hasValidHours,
	hasValidMinutes,
	hasValidMonths,
	hasValidWeekdays,
} from "./cronValidator";
import { JobTypeCustomJob, JobTypeSendEmail, timezones } from "./job.constants";
import type { Job, JobBuilder } from "./job.types";
import { getEncodeByJobType } from "./job.utils";
import { JobCustomFrequencyBuilder } from "./job-custom-frequency-builder";
import { JobStandardFrequencyBuilder } from "./job-standard-frequency-builder";
import { JobTypesBuilder } from "./job-types-builder";

const emptyBuilder: JobBuilder = {
	id: null,
	name: "",
	pixel: "",
	tags: [],
	cronExpression: "0 0 12 * * ?",
	cronTz: "US/Eastern",
	smtpHost: "",
	smtpPort: "",
	subject: "",
	jobType: "Custom Job",
	to: [],
	cc: [],
	bcc: [],
	from: "",
	message: "",
	username: "",
	password: "",
};

export const JobBuilderModal = (props: {
	isOpen: boolean;
	close: () => void;
	getJobs: () => void;
	initialBuilder?: JobBuilder;
	jobs: Job[];
}) => {
	const { isOpen, close, getJobs, initialBuilder, jobs } = props;

	const [frequencyType, setFrequencyType] = useState<"custom" | "standard">(
		"standard",
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [builder, setBuilder] = useState<JobBuilder>(emptyBuilder);
	const [cronExpression, setCronExpression] = useState<string>(
		emptyBuilder.cronExpression,
	);
	const [tzOpen, setTzOpen] = useState(false);

	const setBuilderField = (field: string, value: string | string[]) => {
		setBuilder((prev) => ({ ...prev, [field]: value }));
	};

	const isEditMode = useMemo(() => !!builder.id, [builder.id]);

	const isDuplicateName: boolean = useMemo(() => {
		if (!builder.name.trim()) return false;
		return jobs.some(
			(job) =>
				job.name.toLowerCase() === builder.name.toLowerCase() &&
				(!isEditMode || job.id !== builder.id),
		);
	}, [builder.name, jobs, isEditMode, builder.id]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - keyed on builder id
	useEffect(() => {
		const builderToSet = initialBuilder ? initialBuilder : emptyBuilder;
		setBuilder(builderToSet);
		setCronExpression(builderToSet.cronExpression);
		const cronValues = builderToSet.cronExpression.split(" ");
		if (
			cronValues.length < 6 ||
			Number.isNaN(Number(cronValues[1])) ||
			Number.isNaN(Number(cronValues[2]))
		) {
			setFrequencyType(cronValues.length < 6 ? "standard" : "custom");
			return;
		}
		const isStandard =
			(cronValues[3] === "*" &&
				cronValues[4] === "*" &&
				cronValues[5] === "*") ||
			(cronValues[3] === "*" && cronValues[4] === "*") ||
			(cronValues[4] === "*" && cronValues[5] === "*") ||
			cronValues[5] === "*";
		setFrequencyType(isStandard ? "standard" : "custom");
	}, [initialBuilder ? initialBuilder.id : null]);

	const isCronExpressionValid: boolean = useMemo(() => {
		const cronValues = builder.cronExpression.split(" ");
		if (cronValues.length < 6) return false;
		return (
			!hasValidMinutes(cronValues[1]).error &&
			!hasValidHours(cronValues[2]).error &&
			!hasValidDays(cronValues[3]).error &&
			!hasValidMonths(cronValues[4]).error &&
			!hasValidWeekdays(cronValues[5]).error
		);
	}, [builder.cronExpression]);

	const isBaseFormValid: boolean = useMemo(() => {
		switch (builder.jobType) {
			case JobTypeSendEmail:
				return (
					!!builder.name &&
					!!builder.smtpHost &&
					!!builder.smtpPort &&
					!!builder.subject &&
					!!builder.jobType &&
					!!builder.to &&
					!!builder.from &&
					!!builder.message &&
					!!builder.username &&
					!!builder.password &&
					!!builder.cronTz
				);
			case JobTypeCustomJob:
				return !!builder.name && !!builder.pixel && !!builder.cronTz;
			default:
				return false;
		}
	}, [
		builder.name,
		builder.pixel,
		builder.cronTz,
		builder.smtpHost,
		builder.smtpPort,
		builder.subject,
		builder.jobType,
		builder.to,
		builder.from,
		builder.message,
		builder.username,
		builder.password,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - initialBuilder is stable ref
	const hasChanges: boolean = useMemo(() => {
		if (builder.id == null) return true;
		return (
			builder.name !== initialBuilder.name ||
			builder.pixel !== initialBuilder.pixel ||
			JSON.stringify(builder.tags) !==
				JSON.stringify(initialBuilder.tags) ||
			builder.cronTz !== initialBuilder.cronTz ||
			builder.cronExpression !== initialBuilder.cronExpression ||
			builder.smtpHost !== initialBuilder.smtpHost ||
			builder.smtpPort !== initialBuilder.smtpPort ||
			builder.subject !== initialBuilder.subject ||
			builder.jobType !== initialBuilder.jobType ||
			JSON.stringify(builder.to) !== JSON.stringify(initialBuilder.to) ||
			JSON.stringify(builder.cc) !== JSON.stringify(initialBuilder.cc) ||
			JSON.stringify(builder.bcc) !==
				JSON.stringify(initialBuilder.bcc) ||
			builder.from !== initialBuilder.from ||
			builder.message !== initialBuilder.message ||
			builder.username !== initialBuilder.username ||
			builder.password !== initialBuilder.password
		);
	}, [
		builder.name,
		builder.pixel,
		builder.tags,
		builder.cronTz,
		builder.cronExpression,
		builder.smtpHost,
		builder.smtpPort,
		builder.subject,
		builder.jobType,
		builder.to,
		builder.from,
		builder.message,
		builder.username,
		builder.password,
	]);

	const addJob = async () => {
		setIsLoading(true);
		try {
			const encode = getEncodeByJobType(builder);
			const response = await runPixel(
				`META|ScheduleJob(jobName=["${builder.name}"],${
					builder.tags.length
						? ` jobTags=${JSON.stringify(builder.tags)},`
						: ""
				} jobGroup=["defaultGroup"], cronExpression=["${builder.cronExpression}"], cronTz=["${
					builder.cronTz
				}"], recipe=["<encode>${encode}</encode>"], uiState='{"jobType":"${
					builder.jobType
				}","jobName":"${builder.name}", "cronExpression":"${builder.cronExpression}","cronTimeZone":"${
					builder.cronTz
				}", "recipeParameters":""}',triggerOnLoad=[false],triggerNow=[false]);`,
			);
			if (response.errors.length) throw new Error(response.errors[0]);
			toast.success("Job added successfully");
		} catch {
			toast.error("Unable to add job");
		}
		getJobs();
		closeModal();
		setIsLoading(false);
	};

	const updateJob = async () => {
		setIsLoading(true);
		const encode = getEncodeByJobType(builder);
		const cronExpr =
			builder.cronExpression.split(" ").length < 7
				? `${builder.cronExpression} *`
				: builder.cronExpression;
		await runPixel(
			`META|EditScheduledJob(jobId="${builder.id}",jobName="${builder.name}",${
				builder.tags.length
					? `jobTags=${JSON.stringify(builder.tags)},`
					: ""
			}jobGroup=["defaultGroup"],cronExpression="${cronExpr}",cronTz="${
				builder.cronTz
			}",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${
				builder.jobType
			}", "jobName":"${builder.name}", "cronExpression":"${cronExpr}", "cronTimeZone":"${
				builder.cronTz
			}"}',triggerOnLoad=[false],triggerNow=[false]);`,
		);
		getJobs();
		closeModal();
		setIsLoading(false);
	};

	const closeModal = () => {
		setBuilder(emptyBuilder);
		close();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{isEditMode ? "Edit" : "Add"} Job</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 pt-1">
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Name</Label>
						<Input
							value={builder.name}
							onChange={(e) =>
								setBuilderField("name", e.target.value)
							}
							className={
								isDuplicateName ? "border-destructive" : ""
							}
						/>
						{isDuplicateName && (
							<p className="text-destructive text-xs">
								A job with this name already exists
							</p>
						)}
					</div>
					<JobTypesBuilder
						builder={builder}
						setBuilderField={setBuilderField}
					/>
					<ToggleGroup
						type="single"
						value={frequencyType}
						onValueChange={(val) =>
							val &&
							setFrequencyType(val as "custom" | "standard")
						}
						variant="outline"
					>
						<ToggleGroupItem
							value="standard"
							data-testid={"jobBuilder-standard-btn"}
						>
							Standard
						</ToggleGroupItem>
						<ToggleGroupItem
							value="custom"
							data-testid={"jobBuilder-custom-btn"}
						>
							Custom
						</ToggleGroupItem>
					</ToggleGroup>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Timezone</Label>
						<Popover open={tzOpen} onOpenChange={setTzOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start font-normal"
								>
									{builder.cronTz
										? builder.cronTz.replaceAll("_", " ")
										: "Select timezone..."}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[300px] p-0">
								<Command>
									<CommandInput placeholder="Search timezone..." />
									<CommandList>
										<CommandEmpty>
											No timezone found.
										</CommandEmpty>
										<CommandGroup>
											{timezones.map((tz) => (
												<CommandItem
													key={tz}
													value={tz}
													onSelect={() => {
														setBuilderField(
															"cronTz",
															tz,
														);
														setTzOpen(false);
													}}
												>
													{tz.replaceAll("_", " ")}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>
					{frequencyType === "standard" ? (
						<JobStandardFrequencyBuilder
							cronExpression={cronExpression}
							setBuilderField={setBuilderField}
						/>
					) : (
						<JobCustomFrequencyBuilder
							cronExpression={cronExpression}
							setBuilderField={setBuilderField}
						/>
					)}
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						disabled={isLoading}
						onClick={closeModal}
						data-testid={"jobBuilder-cancel-btn"}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={
							isLoading ||
							!isBaseFormValid ||
							!isCronExpressionValid ||
							!hasChanges ||
							isDuplicateName
						}
						onClick={() => (isEditMode ? updateJob() : addJob())}
						data-testid={"jobBuilder-add-save-btn"}
					>
						{isLoading && <Spinner className="mr-2 size-4" />}
						{isEditMode ? "Save" : "Add"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
