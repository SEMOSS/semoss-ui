import { type RefObject, useEffect, useRef, useState } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	findModelUsageLimitProblem,
	type ModelUsageLimitEditorHandle,
	type ModelUsageLimitSource,
} from "@semoss/shared";

/** What the hook's caller gives it */
interface GrantLimitOptions {
	/** Whether the dialog offers a usage limit: a model, for someone who can set it */
	isOffered: boolean;
	/** Who the limit is for: APP for apps and agents, ENGINE for engines */
	source: ModelUsageLimitSource;
	/** Whether the model has known prices, so the limit can have cost rules */
	isCostAvailable: boolean;
	/** Whether the dialog's form is being submitted, while its fields are disabled */
	isSubmitting: boolean;
}

/** The usage limit an Add dialog gives with a permission */
interface GrantLimit {
	/** The limit picked, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
	/** Sets the limit, from the editor */
	setUsageLimit: (usageLimit: ModelUsageLimit | null) => void;
	/** What stops the limit being saved, or null; always null when no limit is offered */
	limitProblem: string | null;
	/** Whether the editor shows its problems: only once a submit found one */
	shouldShowProblems: boolean;
	/** The editor, to move focus to its first problem */
	editorRef: RefObject<ModelUsageLimitEditorHandle | null>;
	/** Shows the limit's problems, as an invalid submit of the rest of the form does */
	showProblems: () => void;
	/**
	 * Shows the limit's problems and moves focus to the first one once the
	 * submit ends, when the limit has one
	 * @returns whether the limit stops the submit
	 */
	stopsSubmit: () => boolean;
}

/**
 * The usage limit an Add dialog gives every grantee on its list: the limit,
 * what stops it being saved, and when the editor shows its problems. Nothing is
 * marked before a submit; a submit that finds a problem shows them from then
 * on and moves focus to the first one once the submit ends, since the form's
 * fields are disabled while a submit runs.
 *
 * @param options - whether a limit is offered, who it is for, and the form's state
 * @returns the limit and its state
 */
export const useGrantLimit = ({
	isOffered,
	source,
	isCostAvailable,
	isSubmitting,
}: GrantLimitOptions): GrantLimit => {
	const [usageLimit, setUsageLimit] = useState<ModelUsageLimit | null>(null);
	const [shouldShowProblems, setShouldShowProblems] = useState(false);
	const [shouldFocusProblem, setShouldFocusProblem] = useState(false);
	const editorRef = useRef<ModelUsageLimitEditorHandle>(null);
	const limitProblem = isOffered
		? findModelUsageLimitProblem(usageLimit, { source, isCostAvailable })
		: null;

	useEffect(() => {
		if (!shouldFocusProblem || isSubmitting) {
			return;
		}
		editorRef.current?.focusFirstProblem();
		setShouldFocusProblem(false);
	}, [shouldFocusProblem, isSubmitting]);

	return {
		usageLimit,
		setUsageLimit,
		limitProblem,
		shouldShowProblems,
		editorRef,
		showProblems: () => {
			if (limitProblem) {
				setShouldShowProblems(true);
			}
		},
		stopsSubmit: () => {
			if (!limitProblem) {
				return false;
			}
			setShouldShowProblems(true);
			setShouldFocusProblem(true);
			return true;
		},
	};
};
