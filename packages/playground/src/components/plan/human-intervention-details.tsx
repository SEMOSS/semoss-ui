import type React from "react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { Field, FieldLabel, Textarea } from "@semoss/ui/next";
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
	const { t } = useTranslation("common");
	const { details, onDetailsChange } = props;
	const instructionsId = useId();

	return (
		<Field>
			<FieldLabel htmlFor={instructionsId}>
				{t("labels.instructions")}
			</FieldLabel>
			<Textarea
				id={instructionsId}
				value={details.instructions}
				onChange={(e) => {
					onDetailsChange({
						...details,
						instructions: e.target.value,
					});
				}}
				rows={4}
				placeholder={t("plan.instructionsPlaceholder")}
				required
			/>
		</Field>
	);
};
