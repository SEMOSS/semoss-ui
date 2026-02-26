import type React from "react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { Field, FieldLabel, Textarea } from "@semoss/ui/next";
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
	const { t } = useTranslation("common");
	const { details, onDetailsChange } = props;
	const promptId = useId();

	return (
		<Field>
			<FieldLabel htmlFor={promptId}>{t("plan.prompt")}</FieldLabel>
			<Textarea
				id={promptId}
				value={details.prompt}
				onChange={(e) => {
					onDetailsChange({
						...details,
						prompt: e.target.value,
					});
				}}
				rows={4}
				placeholder={t("plan.promptPlaceholder")}
				required
			/>
		</Field>
	);
};
