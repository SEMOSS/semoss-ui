import type React from "react";
import { useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Stepper,
	StepperStep,
	StepperStepLabel,
	Textarea,
} from "@semoss/ui/next";
import type { PlanStep } from "@/types";
import { HumanInterventionDetails } from "./HumanInterventionDetails";
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
	/** Trigger element for the overlay */
	children: React.ReactNode;

	/** Mode of the overlay */
	mode: "Add" | "Update";

	/** Current step if editing */
	current?: PlanStep;

	/** Callback triggered when the data is submitted */
	onSubmit: (step?: PlanStep) => Promise<void>;
}

export const EditStepOverlay: React.FC<EditStepOverlayProps> = (props) => {
	const {
		children,
		mode,
		current = {
			step_name: "",
			step_number: 0,
			description: "",
			type: "tool_call",
			status: "pending",
			details: getStepDetailsDefaults("tool_call"),
		},
		onSubmit = () => null,
	} = props;

	const nameId = useId();
	const descriptionId = useId();
	const typeId = useId();

	const [isOpen, setIsOpen] = useState(false);
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
		<Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{mode} Step</DialogTitle>
				</DialogHeader>

				<Stepper activeStep={activeStep} className="mb-6">
					{steps.map((label) => (
						<StepperStep key={label}>
							<StepperStepLabel>{label}</StepperStepLabel>
						</StepperStep>
					))}
				</Stepper>
				{activeStep === 0 && (
					<div className="space-y-4">
						<div>
							<Label htmlFor={nameId}>Name *</Label>
							<Input
								id={nameId}
								value={step.step_name}
								onChange={(e) =>
									setStep({
										...step,
										step_name: e.target.value,
									})
								}
								className="mt-1"
							/>
						</div>
						<div>
							<Label htmlFor={descriptionId}>Description *</Label>
							<Textarea
								id={descriptionId}
								value={step.description}
								onChange={(e) =>
									setStep({
										...step,
										description: e.target.value,
									})
								}
								rows={3}
								className="mt-1"
							/>
						</div>
						<div>
							<Label htmlFor={typeId}>Type *</Label>
							<Select
								value={step.type}
								onValueChange={(value) => {
									const type = value as PlanStep["type"];
									setStep({
										...step,
										type: type,
										details: getStepDetailsDefaults(type),
									});
								}}
							>
								<SelectTrigger className="mt-1">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="tool_call">
										Tool
									</SelectItem>
									<SelectItem value="llm_reasoning">
										AI
									</SelectItem>
									<SelectItem value="human_intervention">
										User
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}
				{activeStep === 1 && (
					<div className="space-y-4">
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
						{step.details.stepType === "human_intervention" && (
							<HumanInterventionDetails
								details={step.details}
								onDetailsChange={(details) => {
									setStep({
										...step,
										details,
									});
								}}
							/>
						)}
					</div>
				)}

				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => {
							if (activeStep === 0) {
								setIsOpen(false);
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
						variant="default"
						disabled={isDisabled}
						onClick={async () => {
							if (activeStep === steps.length - 1) {
								// submit it
								await onSubmit(step);

								// close it
								setIsOpen(false);

								return;
							}

							// go forward
							setActiveStep((prevStep) => prevStep + 1);
						}}
					>
						{activeStep === steps.length - 1 ? "Confirm" : "Next"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
