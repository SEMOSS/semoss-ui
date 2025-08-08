import { Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	AutocompleteTwo,
	Button,
	IconButton,
	Modal,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	useNotification,
} from "@semoss/ui";
<<<<<<< HEAD
import { cronValidator } from "./cronValidator";
=======
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
import { JobCustomFrequencyBuilder } from "./JobCustomFrequencyBuilder";
import { JobStandardFrequencyBuilder } from "./JobStandardFrequencyBuilder";
import { JobTypesBuilder } from "./JobTypesBuilder";
import { JobTypeCustomJob, JobTypeSendEmail, timezones } from "./job.constants";
<<<<<<< HEAD
import { JobBuilder } from "./job.types";
=======
import type { JobBuilder } from "./job.types";
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
import { getEncodeByJobType } from "./job.utils";

const emptyBuilder: JobBuilder = {
	id: null,
	name: "",
	pixel: "",
	tags: [],
<<<<<<< HEAD
	cronExpression: "0 0 12 ? * ?",
=======
	cronExpression: "0 0 12 * * ?",
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
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
	const setBuilderField = (field: string, value: string | string[]) => {
		setBuilder((previousBuilder) => ({
			...previousBuilder,
			[field]: value,
		}));
	};

	const isEditMode = useMemo(() => {
		return !!builder.id;
	}, [builder.id]);

<<<<<<< HEAD
	// Set builder on open/edit, use initialBuilder.cronExpression as-is
	useEffect(() => {
		if (initialBuilder) {
			setBuilder(initialBuilder);
			// Optionally set frequencyType based on cronExpression if needed
		} else {
			setBuilder(emptyBuilder);
		}
	}, [initialBuilder]);

	const cronValidation = useMemo(() => {
		const result = cronValidator.validate(builder.cronExpression);
		return result;
	}, [builder.cronExpression]);

	const isCronExpressionValid: boolean = cronValidation.isValid;
=======
	useEffect(() => {
		const builderToSet = initialBuilder ? initialBuilder : emptyBuilder;
		setBuilder(builderToSet);
		const cronValues = builderToSet.cronExpression.split(" ");
		if (cronValues.length < 6) {
			// invalid cron syntax, send to standard builder
			setFrequencyType("standard");
			return;
		} else if (Number.isNaN(cronValues[1]) || Number.isNaN(cronValues[2])) {
			// non-integer time values, must be custom
			setFrequencyType("custom");
			return;
		}

		if (
			cronValues[3] == "*" &&
			cronValues[4] == "*" &&
			cronValues[5] == "*"
		) {
			setFrequencyType("standard");
			return;
		} else if (cronValues[3] == "*" && cronValues[4] == "*") {
			setFrequencyType("standard");
			return;
		} else if (cronValues[4] == "*" && cronValues[5] == "*") {
			setFrequencyType("standard");
			return;
		} else if (cronValues[5] == "*") {
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
		if (
			cronValues[1] !== "*" &&
			!(
				!Number.isNaN(cronValues[1]) &&
				parseInt(cronValues[1]) <= 59 &&
				parseInt(cronValues[1]) >= 0
			)
		) {
			return false;
		}
		if (
			cronValues[2] !== "*" &&
			!(
				!Number.isNaN(cronValues[2]) &&
				parseInt(cronValues[2]) <= 23 &&
				parseInt(cronValues[2]) >= 0
			)
		) {
			return false;
		}
		if (
			cronValues[3] !== "*" &&
			!(
				!Number.isNaN(cronValues[3]) &&
				parseInt(cronValues[3]) <= 31 &&
				parseInt(cronValues[3]) >= 0
			)
		) {
			return false;
		}
		if (
			cronValues[4] !== "*" &&
			!(
				!Number.isNaN(cronValues[4]) &&
				parseInt(cronValues[4]) <= 12 &&
				parseInt(cronValues[4]) >= 1
			)
		) {
			return false;
		}
		if (
			cronValues[5] !== "?" &&
			!(
				!Number.isNaN(cronValues[5]) &&
				parseInt(cronValues[5]) <= 6 &&
				parseInt(cronValues[5]) >= 0
			)
		) {
			return false;
		}
		return true;
	}, [builder.cronExpression]);
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053

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
<<<<<<< HEAD
		if (builder.id == null || !initialBuilder) {
=======
		if (builder.id == null) {
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
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
<<<<<<< HEAD
		builder.cc,
		builder.bcc,
		builder.id,
		initialBuilder,
	]);

	// Don't close modal before error notification
=======
	]);

>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
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
				}","cronTimeZone":"${builder.cronTz}","recipe":"${
					builder.pixel
				}","recipeParameters":""}',triggerOnLoad=[false],triggerNow=[false]);`,
			);
			if (response.errors.length) {
<<<<<<< HEAD
				await notification.add({
					color: "error",
					message: response.errors[0], // fixed typo: should be response.errors[0]
				});
				setIsLoading(false);
				return; // Don't close modal
			}
		} catch (_e) {
			await notification.add({
				color: "error",
				message: "Unable to add job",
			});
			setIsLoading(false);
			return; // Don't close modal
=======
				notification.add({
					color: "error",
					message: response.errors.length[0],
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: "Unable to add job",
			});
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
		}
		getJobs();
		closeModal();
		setIsLoading(false);
	};

<<<<<<< HEAD
	// Similar fix for updateJob
	const updateJob = async () => {
		setIsLoading(true);
		const encode = getEncodeByJobType(builder);
		try {
			const response = await runPixel(
				`META|EditScheduledJob(jobId="${builder.id}",jobName="${
					builder.name
				}",${
					builder.tags.length
						? `jobTags=${JSON.stringify(builder.tags)},`
						: ""
				}jobGroup=["defaultGroup"],cronExpression="${builder.cronExpression}",cronTz="${builder.cronTz}",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${builder.jobType}", "jobName":"${builder.name}", "cronExpression":"${builder.cronExpression}", "cronTimeZone":"${builder.cronTz}"}',triggerOnLoad=[false],triggerNow=[false]);`,
			);
			if (response.errors.length) {
				await notification.add({
					color: "error",
					message: response.errors[0],
				});
				setIsLoading(false);
				return;
			}
		} catch (_e) {
			notification.add({
				color: "error",
				message: "Unable to update job",
			});
			setIsLoading(false);
			return;
		}
=======
	const updateJob = async () => {
		setIsLoading(true);
		const encode = getEncodeByJobType(builder);
		await runPixel(
			`META|EditScheduledJob(jobId="${builder.id}",jobName="${
				builder.name
			}",${
				builder.tags.length
					? `jobTags=${JSON.stringify(builder.tags)},`
					: ""
			}jobGroup=["defaultGroup"],cronExpression="${
				builder.cronExpression
			} *",cronTz="${
				builder.cronTz
			}",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${
				builder.jobType
			}", "jobName":"${builder.name}", "cronExpression":"${
				builder.cronExpression
			}", "cronTimeZone":"${
				builder.cronTz
			}"}',triggerOnLoad=[false],triggerNow=[false]);`,
		);
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
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
						data-testid={"job-builder-close-btn"}
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
							data-testid={"job-builder-standard-btn"}
						>
							Standard
						</ToggleButton>
						<ToggleButton
							value="custom"
							onClick={() => setFrequencyType("custom")}
							data-testid={"job-builder-custom-btn"}
						>
							Custom
						</ToggleButton>
					</ToggleButtonGroup>
					<AutocompleteTwo
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
							builder={builder}
							setBuilderField={setBuilderField}
						/>
					) : (
						<JobCustomFrequencyBuilder
							builder={builder}
							setBuilderField={setBuilderField}
						/>
					)}
<<<<<<< HEAD
					{!isCronExpressionValid &&
						cronValidation.errors.length > 0 && (
							<Stack spacing={0.5} paddingX={1}>
								<div
									style={{
										color: "#d32f2f",
										fontSize: "0.875rem",
										fontWeight: 500,
									}}
								>
									Cron Expression Validation Errors:
								</div>
								{cronValidation.errors.map((error, idx) => (
									<div
										key={idx}
										style={{
											color: "#d32f2f",
											fontSize: "0.75rem",
											paddingLeft: "8px",
										}}
									>
										• {error}
									</div>
								))}
							</Stack>
						)}
=======
>>>>>>> 434cedd22081a509339fb7bf7b75106533a8b053
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
						data-testid={"job-builder-cancel-btn"}
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
						data-testid={"job-builder-add-save-btn"}
					>
						{isEditMode ? "Save" : "Add"}
					</Button>
				</Stack>
			</Modal.Actions>
		</Modal>
	);
};
