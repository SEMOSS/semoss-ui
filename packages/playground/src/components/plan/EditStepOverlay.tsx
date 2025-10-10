import { Close } from "@mui/icons-material";
import type React from "react";
import { useState } from "react";
import {
	Button,
	Grid,
	IconButton,
	Modal,
	Select,
	Stack,
	Stepper,
	TextField,
	Typography,
} from "@semoss/ui";
import type { PlanStep } from "@/types";
import { LLMReasoningDetails } from "./LLMReasoningDetails";
import { ToolCallDetails } from "./ToolCallDetails";

const getStepDetailsDefaults = (
	type: PlanStep["type"],
): PlanStep["details"] => {
	if (type === "tool_call") {
		return {
			title: "",
			stepType: "tool_call",
			tool_name: "",
			parameters: {},
			rationaleForStep: "",
			_meta: {
				map: {
					SMSS_PROJECT_NAME: "",
					SMSS_PROJECT_ID: "",
				},
			},
		};
	} else if (type === "llm_reasoning") {
		return {
			stepType: "llm_reasoning",
			prompt: "",
			rationaleForStep: "",
		};
	} else if (type === "human_intervention") {
		return {
			stepType: "human_intervention",
			required_role: "",
			instructions: "",
			rationaleForStep: "",
		};
	}
};

interface EditStepOverlayProps {
	/** Mode of the overlay */
	mode: "Add" | "Edit";

	/** Current step if editing */
	current?: PlanStep;

	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean, step?: PlanStep) => void;
}

export const EditStepOverlay: React.FC<EditStepOverlayProps> = (props) => {
	const {
		mode,
		current = {
			step_name: "",
			step_number: 0,
			description: "",
			type: "tool_call",
			status: "pending",
			details: getStepDetailsDefaults("tool_call"),
		},
		onClose,
	} = props;

	const [activeStep, setActiveStep] = useState(0);
	const [step, setStep] = useState<PlanStep>({
		step_name: current.step_name,
		step_number: current.step_number,
		description: current.description,
		type: current.type,
		status: current.status,
		// always reset the details to ensure compatibility
		details: getStepDetailsDefaults(current.type),
	});

	const steps = ["Overview", "Details"];

	// track if the next button is disabled
	let isDisabled = false;
	if (activeStep === 0) {
		isDisabled =
			step.step_name.trim() === "" ||
			step.description.trim() === "" ||
			!step.details.stepType;
	} else if (activeStep === 1) {
		if (step.details.stepType === "tool_call") {
			isDisabled =
				!step.details._meta.map.SMSS_PROJECT_ID ||
				!step.details.tool_name;
		} else if (step.details.stepType === "llm_reasoning") {
			isDisabled = step.details.prompt.trim() === "";
		} else if (step.details.stepType === "human_intervention") {
			isDisabled = true; // TODO: update when fields are added
		}
	}

	return (
		<Modal
			open={true}
			onClose={() => onClose(false)}
			aria-labelledby="Add step"
			aria-describedby="Add step"
			maxWidth={"md"}
			fullWidth={true}
			scroll="paper"
		>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">{mode} Step</Typography>
					<IconButton size="small" onClick={() => onClose(false)}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Stepper activeStep={activeStep} sx={{ mb: 3 }}>
					{steps.map((label) => (
						<Stepper.Step key={label}>
							<Stepper.StepLabel>{label}</Stepper.StepLabel>
						</Stepper.Step>
					))}
				</Stepper>
				{activeStep === 0 && (
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Name"
								value={step.step_name}
								onChange={(e) =>
									setStep({
										...step,
										step_name: e.target.value,
									})
								}
								required
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Description"
								value={step.description}
								onChange={(e) =>
									setStep({
										...step,
										description: e.target.value,
									})
								}
								multiline
								rows={3}
								required
							/>
						</Grid>
						<Grid item xs={12}>
							<Select
								fullWidth
								label="Type"
								value={step.type}
								onChange={(e) => {
									const type = e.target
										.value as PlanStep["type"];

									setStep({
										...step,
										type: type,
										details: getStepDetailsDefaults(type),
									});
								}}
								required
							>
								<Select.Item value="tool_call">
									Tool
								</Select.Item>
								<Select.Item value="llm_reasoning">
									AI
								</Select.Item>
							</Select>
						</Grid>
					</Grid>
				)}
				{activeStep === 1 && (
					<Grid container spacing={2}>
						{step.details.stepType === "tool_call" && (
							<ToolCallDetails
								details={step.details}
								onDetailsChange={(details) => {
									setStep({
										...step,
										details,
									});
								}}
							/>
						)}
						{step.details.stepType === "llm_reasoning" && (
							<LLMReasoningDetails
								details={step.details}
								onDetailsChange={(details) => {
									setStep({
										...step,
										details,
									});
								}}
							/>
						)}
					</Grid>
				)}
			</Modal.Content>
			<Modal.Actions>
				<Button
					variant="text"
					onClick={() => {
						if (activeStep === 0) {
							onClose(false);
							return;
						}

						// reset
						setStep({
							...step,
							details: getStepDetailsDefaults(step.type),
						});

						// go back
						setActiveStep((prevStep) => prevStep - 1);
					}}
				>
					{activeStep === 0 ? "Cancel" : "Back"}
				</Button>
				<Button
					variant="contained"
					disabled={isDisabled}
					onClick={() => {
						if (activeStep === steps.length - 1) {
							onClose(true, step);
							return;
						}

						// go forward
						setActiveStep((prevStep) => prevStep + 1);
					}}
				>
					{activeStep === steps.length - 1 ? "Confirm" : "Next"}
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
