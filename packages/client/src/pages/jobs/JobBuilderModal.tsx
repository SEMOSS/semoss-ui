import { Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Autocomplete,
	Button,
	IconButton,
	Modal,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	useNotification,
} from "@semoss/ui";
import {
	hasValidDays,
	hasValidHours,
	hasValidMinutes,
	hasValidMonths,
	hasValidWeekdays,
} from "./cronValidator";
import { JobCustomFrequencyBuilder } from "./JobCustomFrequencyBuilder";
import { JobStandardFrequencyBuilder } from "./JobStandardFrequencyBuilder";
import { JobTypesBuilder } from "./JobTypesBuilder";
import { JobTypeCustomJob, JobTypeSendEmail, timezones } from "./job.constants";
import type { JobBuilder } from "./job.types";
import { getEncodeByJobType } from "./job.utils";

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
}) => {
	const { isOpen, close, getJobs, initialBuilder } = props;
	const notification = useNotification();

	const [frequencyType, setFrequencyType] = useState<"custom" | "standard">(
		"standard",
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [builder, setBuilder] = useState<JobBuilder>(emptyBuilder);
	const [cronExpression, setCronExpression] = useState<string>(
		emptyBuilder.cronExpression,
	);
	const setBuilderField = (field: string, value: string | string[]) => {
		setBuilder((previousBuilder) => ({
			...previousBuilder,
			[field]: value,
		}));
	};

	const isEditMode = useMemo(() => {
		return !!builder.id;
	}, [builder.id]);

	useEffect(() => {
		const builderToSet = initialBuilder ? initialBuilder : emptyBuilder;
		setBuilder(builderToSet);
		setCronExpression(builderToSet.cronExpression);
		const cronValues = builderToSet.cronExpression.split(" ");
		if (cronValues.length < 6) {
			// invalid cron syntax, send to standard builder
			setFrequencyType("standard");
			return;
		} else if (
			isNaN(Number(cronValues[1])) ||
			isNaN(Number(cronValues[2]))
		) {
			// non-integer time values, must be custom
			setFrequencyType("custom");
			return;
		}

		if (
			cronValues[3] === "*" &&
			cronValues[4] === "*" &&
			cronValues[5] === "*"
		) {
			setFrequencyType("standard");
			return;
		} else if (cronValues[3] === "*" && cronValues[4] === "*") {
			setFrequencyType("standard");
			return;
		} else if (cronValues[4] === "*" && cronValues[5] === "*") {
			setFrequencyType("standard");
			return;
		} else if (cronValues[5] === "*") {
			setFrequencyType("standard");
			return;
		} else {
			setFrequencyType("custom");
			return;
		}
	}, [initialBuilder ? initialBuilder.id : null]);

	const isCronExpressionValid: boolean = useMemo(() => {
		const cronValues = builder.cronExpression.split(" ");
		if (cronValues.length < 6) {
			// make sure it's valid cron syntax
			return false;
		}
		if (hasValidMinutes(cronValues[1]).error) {
			return false;
		}
		if (hasValidHours(cronValues[2]).error) {
			return false;
		}
		if (hasValidDays(cronValues[3]).error) {
			return false;
		}
		if (hasValidMonths(cronValues[4]).error) {
			return false;
		}
		if (hasValidWeekdays(cronValues[5]).error) {
			return false;
		}
		return true;
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

	const hasChanges: boolean = useMemo(() => {
		if (builder.id == null) {
			return true;
		}

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
				} jobGroup=["defaultGroup"], cronExpression=["${
					builder.cronExpression
				}"], cronTz=["${
					builder.cronTz
				}"], recipe=["<encode>${encode}</encode>"], uiState='{"jobType":"${
					builder.jobType
				}","jobName":"${builder.name}", "cronExpression":"${
					builder.cronExpression
				}","cronTimeZone":"${builder.cronTz}", "recipeParameters":""}',triggerOnLoad=[false],triggerNow=[false]);`,
			);
			if (response.errors.length) {
				throw new Error(response.errors[0]);
			}
			notification.add({
				color: "success",
				message: "Job added successfully",
			});
		} catch {
			notification.add({
				color: "error",
				message: "Unable to add job",
			});
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
			`META|EditScheduledJob(jobId="${builder.id}",jobName="${
				builder.name
			}",${
				builder.tags.length
					? `jobTags=${JSON.stringify(builder.tags)},`
					: ""
			}jobGroup=["defaultGroup"],cronExpression="${cronExpr}",cronTz="${
				builder.cronTz
			}",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${
				builder.jobType
			}", "jobName":"${builder.name}", "cronExpression":"${
				cronExpr
			}", "cronTimeZone":"${
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
		<Modal open={isOpen} maxWidth="md" fullWidth>
			<Modal.Title>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
				>
					<span>{isEditMode ? "Edit" : "Add"} Job</span>
					<IconButton
						aria-label="close"
						onClick={closeModal}
						data-testid={"jobBuilder-close-btn"}
					>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Stack spacing={2} paddingTop={1}>
					<TextField
						label="Name"
						size="small"
						value={builder.name}
						onChange={(e) =>
							setBuilderField("name", e.target.value)
						}
					/>
					<JobTypesBuilder
						builder={builder}
						setBuilderField={setBuilderField}
					/>
					<ToggleButtonGroup value={frequencyType} size="small">
						<ToggleButton
							value="standard"
							onClick={() => setFrequencyType("standard")}
							data-testid={"jobBuilder-standard-btn"}
						>
							Standard
						</ToggleButton>
						<ToggleButton
							value="custom"
							onClick={() => setFrequencyType("custom")}
							data-testid={"jobBuilder-custom-btn"}
						>
							Custom
						</ToggleButton>
					</ToggleButtonGroup>
					<Autocomplete
						multiple={false}
						value={builder.cronTz}
						options={timezones}
						onChange={(_, value) =>
							setBuilderField("cronTz", value)
						}
						size="small"
						getOptionLabel={(option: string) =>
							option.replaceAll("_", " ")
						}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								label="Timezone"
							/>
						)}
					/>
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
				</Stack>
			</Modal.Content>
			<Modal.Actions>
				<Stack
					direction="row"
					spacing={1}
					paddingX={2}
					paddingBottom={2}
				>
					<Button
						type="button"
						disabled={isLoading}
						onClick={closeModal}
						data-testid={"jobBuilder-cancel-btn"}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant={"contained"}
						disabled={
							isLoading ||
							!isBaseFormValid ||
							!isCronExpressionValid ||
							!hasChanges
						}
						onClick={() => {
							isEditMode ? updateJob() : addJob();
						}}
						loading={isLoading}
						data-testid={"jobBuilder-add-save-btn"}
					>
						{isEditMode ? "Save" : "Add"}
					</Button>
				</Stack>
			</Modal.Actions>
		</Modal>
	);
};
