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
	TextField,
	Typography,
} from "@semoss/ui";
import type { PlanStep } from "@/types";

type NewStep = Omit<PlanStep, "step_number">;

interface AddStepOverlayProps {
	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean, step?: NewStep) => void;
}

export const AddStepOverlay: React.FC<AddStepOverlayProps> = (props) => {
	const { onClose } = props;

	const [step, setStep] = useState<NewStep>({
		step_name: "",
		description: "",
		type: "tool_call",
		status: "pending",
		details: {
			stepType: "tool_call",
			tool_name: "",
			parameters: {},
			rationaleForStep: "",
		},
	});

	/**
	 * Get the details for the step based on its type.
	 */
	const getDetailsDefaults = (type: NewStep["type"]): NewStep["details"] => {
		if (type === "tool_call") {
			return {
				stepType: "tool_call",
				tool_name: "",
				parameters: {},
				rationaleForStep: "",
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
					<Typography variant="h6">Add Step</Typography>
					<IconButton size="small" onClick={() => onClose(false)}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Step Name"
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
								const type = e.target.value as NewStep["type"];

								setStep({
									...step,
									type: type,
									details: getDetailsDefaults(type),
								});
							}}
							required
						>
							<Select.Item value="tool_call">Tool</Select.Item>
							<Select.Item value="llm_reasoning">AI</Select.Item>
							<Select.Item value="human_intervention">
								Human
							</Select.Item>
						</Select>
					</Grid>
				</Grid>
			</Modal.Content>
			<Modal.Actions>
				<Button variant="text" onClick={() => onClose(false)}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={() => {
						onClose(true, step);
					}}
				>
					Add
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
