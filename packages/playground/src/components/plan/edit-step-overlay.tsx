import type React from "react";
import { useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
	Input,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type { PlanStep } from "@/types";
// import { HumanInterventionDetails } from "./human-intervention-details";
import { LLMReasoningDetails } from "./llm-reasoning-details";
import { ToolCallDetails } from "./tool-call-details";

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
				SMSS_PROJECT_NAME: "",
				SMSS_PROJECT_ID: "",
			},
		};
	} else if (type === "llm_reasoning") {
		return {
			stepType: "llm_reasoning",
			prompt: "",
			rationaleForStep: "",
		};
	}
	// } else if (type === "human_intervention") {
	// 	return {
	// 		stepType: "human_intervention",
	// 		required_role: "",
	// 		instructions: "",
	// 		rationaleForStep: "",
	// 	};
	// }
};

interface EditStepOverlayProps {
	/** Mode of the overlay */
	mode: "New" | "Edit";

	/** Current step if editing */
	current?: PlanStep;

	/** Track if the overlay is open */
	open: boolean;

	/** Update the state of the overlay */
	onOpenChange: (isOpen: boolean) => void;

	/** Callback triggered when the data is submitted */
	onSubmit: (step?: PlanStep) => Promise<void>;
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
		open,
		onOpenChange,
		onSubmit = () => null,
	} = props;

	const nameId = useId();
	const descriptionId = useId();
	const typeId = useId();

	const [step, setStep] = useState<PlanStep>({
		step_name: current.step_name,
		step_number: current.step_number,
		description: current.description,
		type: current.type,
		status: current.status,
		details: current.details,
	});

	// track if the next button is disabled
	const isDisabled =
		step.step_name.trim() === "" ||
		step.description.trim() === "" ||
		!step.details.stepType ||
		(step.details.stepType === "tool_call" &&
			(!step.details._meta.SMSS_PROJECT_ID || !step.details.tool_name)) ||
		(step.details.stepType === "llm_reasoning" &&
			step.details.prompt.trim() === "") ||
		step.details.stepType === "human_intervention";

	return (
		<Dialog open={open} onOpenChange={(open) => onOpenChange(open)}>
			<DialogContent
				aria-describedby="Edit the details of the step"
				className="sm:max-w-4xl"
			>
				<DialogHeader>
					<DialogTitle>{mode} Step</DialogTitle>
				</DialogHeader>
				<form>
					<FieldSet>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={nameId}>Name</FieldLabel>
								<Input
									id={nameId}
									value={step.step_name}
									onChange={(e) =>
										setStep({
											...step,
											step_name: e.target.value,
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={descriptionId}>
									Description
								</FieldLabel>
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
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={typeId}>Type</FieldLabel>
								<Select
									value={step.type}
									onValueChange={(value) => {
										const type = value as PlanStep["type"];
										setStep({
											...step,
											type: type,
											details:
												getStepDetailsDefaults(type),
										});
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>Type</SelectLabel>

											<SelectItem value="tool_call">
												Tool
											</SelectItem>
											<SelectItem value="llm_reasoning">
												AI
											</SelectItem>
											{/* <SelectItem value="human_intervention">
												User
											</SelectItem> */}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						</FieldGroup>
						<FieldSeparator />

						<FieldGroup>
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
							{/* {step.details.stepType === "human_intervention" && (
								<HumanInterventionDetails
									details={step.details}
									onDetailsChange={(details) => {
										setStep({
											...step,
											details,
										});
									}}
								/>
							)} */}
						</FieldGroup>
					</FieldSet>
				</form>
				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => {
							onOpenChange(false);
						}}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						disabled={isDisabled}
						onClick={async () => {
							// submit it
							await onSubmit(step);

							// close it
							onOpenChange(false);
						}}
					>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
