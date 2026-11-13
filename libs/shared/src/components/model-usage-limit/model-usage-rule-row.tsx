import { EngineUsageRuleRow } from "./engine-usage-rule-row";
import {
	MODEL_USAGE_METRICS,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";
import type { ModelUsageRuleDraft } from "./model-usage-rule-draft";

/** Props for {@link ModelUsageRuleRow}. */
export interface ModelUsageRuleRowProps {
	/** The rule as the editor holds it */
	draft: ModelUsageRuleDraft;
	/** Its place in the list, from 1, for the controls' names */
	number: number;
	/** Where the limit is set, which decides the counts offered */
	source: ModelUsageLimitSource;
	/** Whether the model has known prices, so Cost can be chosen */
	isCostAvailable: boolean;
	/**
	 * Why the rule cannot be saved, or null when it can or the editor does not
	 * show problems yet; its fields are marked invalid only while this is set
	 */
	problem: string | null;
	/** Why the rule may never be reached, or null */
	warning: string | null;
	/** Called with the rule after an edit */
	onChange: (draft: ModelUsageRuleDraft) => void;
	/** Called to remove the rule */
	onRemove: () => void;
}

/** Compatibility wrapper preserving the model-only metric contract. */
export const ModelUsageRuleRow = (props: ModelUsageRuleRowProps) => (
	<EngineUsageRuleRow
		{...props}
		metrics={MODEL_USAGE_METRICS}
		onChange={(next) => {
			const metric = MODEL_USAGE_METRICS.find(
				(item) => item === next.metric,
			);
			if (!metric) throw new Error("Unsupported model usage metric");
			props.onChange({ ...next, metric });
		}}
	/>
);
