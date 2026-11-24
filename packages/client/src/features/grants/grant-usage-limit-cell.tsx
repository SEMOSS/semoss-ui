import type { ModelUsageLimit } from "@semoss/sdk";
import { UsageLimitEditButton } from "@/features/bulk-access-management/usage-limit-edit-button";
import { UsageLimitSummary } from "@/features/bulk-access-management/usage-limit-summary";

/** Props for {@link GrantUsageLimitCell}. */
export interface GrantUsageLimitCellProps {
	/** The limit, or null for no limit defined */
	limit: ModelUsageLimit | null | undefined;
	/** Who the limit is for: APP for an app or agent, ENGINE for an engine */
	source: "APP" | "ENGINE";
	/** Whether the permission is on a model; anything else has no usage limit */
	isModel: boolean;
	/**
	 * Called to edit the limit; without it the limit is read-only with
	 * `readOnlyNote` under it
	 */
	onEdit?: () => void;
	/** Whether the edit button is disabled, while saving */
	disabled?: boolean;
	/** What the edit button changes, for screen readers, such as "Usage limit for Orders Agent" */
	context: string;
	/** Why the limit is read-only, such as "Only owners can set usage limits" */
	readOnlyNote: string;
}

/**
 * A permission's usage limit in a table row: on a model, the summary as a
 * button that opens its dialog, or the summary with why it cannot be changed;
 * on anything else, that it has no usage limit.
 */
export const GrantUsageLimitCell = ({
	limit,
	source,
	isModel,
	onEdit,
	disabled = false,
	context,
	readOnlyNote,
}: GrantUsageLimitCellProps) => {
	if (!isModel) {
		return <span className="text-muted-foreground">No usage limit</span>;
	}
	const summary = (
		<UsageLimitSummary limit={limit} isChanged={false} source={source} />
	);
	return onEdit ? (
		<UsageLimitEditButton
			disabled={disabled}
			context={context}
			onClick={onEdit}
		>
			{summary}
		</UsageLimitEditButton>
	) : (
		<span className="flex max-w-64 flex-col gap-0.5 whitespace-normal">
			{summary}
			<span className="text-muted-foreground text-xs">
				{readOnlyNote}
			</span>
		</span>
	);
};
