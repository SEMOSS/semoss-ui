import type React from "react";
import { Grid, TextField } from "@semoss/ui";
import type { PlanStep } from "@/types";

type HumanInterventionDetails = Extract<
	PlanStep["details"],
	{ stepType: "human_intervention" }
>;

interface HumanInterventionDetailsProps {
	/** Detail state */
	details: HumanInterventionDetails;

	/** Update the details state */
	onDetailsChange: (details: HumanInterventionDetails) => void;
}

export const HumanInterventionDetails: React.FC<
	HumanInterventionDetailsProps
> = (props) => {
	const { details, onDetailsChange } = props;

	return (
		<Grid item xs={12}>
			<TextField
				fullWidth
				label="Instructions"
				value={details.instructions}
				onChange={(e) => {
					onDetailsChange({
						...details,
						instructions: e.target.value,
					});
				}}
				multiline
				rows={4}
				required
				placeholder="Instructions for the ai to process the user's feedback"
			/>
		</Grid>
	);
};
