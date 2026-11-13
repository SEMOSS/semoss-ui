import type { Ref } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import { EngineUsageLimitEditor } from "./engine-usage-limit-editor";
import {
	MODEL_USAGE_METRICS,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";

/** What a host can ask of {@link ModelUsageLimitEditor} through its `ref`. */
export interface ModelUsageLimitEditorHandle {
	/**
	 * Moves focus to the first field marked invalid, or to Add Rule when Rules
	 * has no rules, once the problems are drawn. A host calls it with
	 * `shouldShowProblems` on a save attempt the limit stops.
	 */
	focusFirstProblem: () => void;
}

/** Props for {@link ModelUsageLimitEditor}. */
export interface ModelUsageLimitEditorProps {
	/**
	 * The limit the editor starts from, or null for no limit defined. The editor
	 * keeps what is typed after that; give it a new key to start it again.
	 */
	defaultValue: ModelUsageLimit | null;
	/**
	 * Called with the limit after every edit, or null for no limit defined. A
	 * rule still being typed has no amount; check the limit with
	 * `findModelUsageLimitProblem` before saving it.
	 */
	onChange?: (value: ModelUsageLimit | null) => void;
	/** Where the limit is set, which decides whose use its rules can count */
	source: ModelUsageLimitSource;
	/**
	 * Whether the model has known prices, so Cost can be chosen. A limit across
	 * all models always offers Cost, with a note on models without prices.
	 */
	isCostAvailable?: boolean;
	/** What applies when no limit is defined, in place of the source's usual words */
	notDefinedHint?: string;
	/** Why the viewer cannot change the limit; the editor then only shows it */
	readOnlyReason?: string | null;
	/**
	 * Whether every control is disabled, such as while the host saves the
	 * limit; the editor keeps what is typed
	 */
	disabled?: boolean;
	/** The label above the choice, such as "User's Total Model Limit" */
	label?: string;
	/**
	 * Whether each rule shows why it cannot be saved, with its field marked
	 * invalid. A host leaves it false until the user tries to save a limit
	 * `findModelUsageLimitProblem` stops, so a rule just added is not marked
	 * before anything is typed; from then on the problems follow the edits.
	 * Warnings and notes show either way.
	 */
	shouldShowProblems?: boolean;
	/** Lets the host move focus to the first problem after a save attempt */
	ref?: Ref<ModelUsageLimitEditorHandle>;
	/** Classes for the editor */
	className?: string;
}

/** Compatibility adapter: existing model props, metrics and payloads stay unchanged. */
export const ModelUsageLimitEditor = (props: ModelUsageLimitEditorProps) => (
	<EngineUsageLimitEditor
		{...props}
		metrics={MODEL_USAGE_METRICS}
		onChange={(value) => {
			if (!value) {
				props.onChange?.(null);
				return;
			}
			const rules = value.rules.map((rule) => {
				const metric = MODEL_USAGE_METRICS.find(
					(item) => item === rule.metric,
				);
				if (!metric) throw new Error("Unsupported model usage metric");
				return { ...rule, metric };
			});
			props.onChange?.({ ...value, rules });
		}}
	/>
);
