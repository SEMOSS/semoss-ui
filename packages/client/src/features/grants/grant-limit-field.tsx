import type { RefObject } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
} from "@semoss/shared";

/** Props for {@link GrantLimitField}. */
export interface GrantLimitFieldProps {
	/** Whether the user can set the limit; otherwise the field says why not */
	canSetLimit: boolean;
	/** Who the limit is for: APP for apps and agents, ENGINE for engines */
	source: "APP" | "ENGINE";
	/** The editor's label, such as "App Limit" */
	label: string;
	/** Whether the model has known prices, so the limit can have cost rules */
	isCostAvailable: boolean;
	/** Called with the limit picked, or null for no limit defined */
	onChange: (usageLimit: ModelUsageLimit | null) => void;
	/** The editor, to move focus to its first problem */
	editorRef: RefObject<ModelUsageLimitEditorHandle | null>;
	/** Whether the editor shows its problems */
	shouldShowProblems: boolean;
	/** What the limit is given to, such as "Everything on the list gets its own copy of this limit." */
	copyNote: string;
	/** Whether the editor is disabled, while the form is submitted */
	disabled?: boolean;
	/** Whether the guide is read in admin mode */
	admin?: boolean;
}

/**
 * The usage limit an Add dialog gives on a model: the editor, starting at No
 * Limit Defined, with who gets a copy, or why the user cannot set one, and the
 * How Usage Limits Work guide.
 */
export const GrantLimitField = ({
	canSetLimit,
	source,
	label,
	isCostAvailable,
	onChange,
	editorRef,
	shouldShowProblems,
	copyNote,
	disabled = false,
	admin = false,
}: GrantLimitFieldProps) => (
	<div className="flex flex-col gap-1">
		{canSetLimit ? (
			<>
				<ModelUsageLimitEditor
					ref={editorRef}
					defaultValue={null}
					onChange={onChange}
					source={source}
					label={label}
					isCostAvailable={isCostAvailable}
					shouldShowProblems={shouldShowProblems}
					disabled={disabled}
				/>
				<p className="text-muted-foreground text-xs">{copyNote}</p>
			</>
		) : (
			<p className="text-muted-foreground text-xs">
				{OWNERS_ONLY_LIMIT_REASON}. Everything on the list starts with
				No Limit Defined.
			</p>
		)}
		<UsageLimitGuideButton
			className="self-start"
			section="rules"
			viewer={{ canSetModelLimits: canSetLimit, isAdminMode: admin }}
		/>
	</div>
);
