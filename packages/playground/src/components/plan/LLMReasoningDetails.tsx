import type React from "react";
import { Grid, TextField } from "@semoss/ui";
import type { PlanStep } from "@/types";

type LLMReasoningDetails = Extract<
	PlanStep["details"],
	{ stepType: "llm_reasoning" }
>;

interface LLMReasoningDetailsProps {
	/** Detail state */
	details: LLMReasoningDetails;

	/** Update the details state */
	onDetailsChange: (details: LLMReasoningDetails) => void;
}

export const LLMReasoningDetails: React.FC<LLMReasoningDetailsProps> = (
	props,
) => {
	const { details, onDetailsChange } = props;

	return (
		<Grid item xs={12}>
			<TextField
				fullWidth
				label="Prompt"
				value={details.prompt}
				onChange={(e) => {
					onDetailsChange({
						...details,
						prompt: e.target.value,
					});
				}}
				multiline
				rows={4}
				required
				placeholder="Enter the instructions for the AI"
			/>
		</Grid>
	);
};
