import type { ModelUsageLimit } from "@semoss/sdk";
import {
	describeModelUsageLimit,
	isSameModelUsageLimit,
	ModelUsageLimitRules,
	type ModelUsageLimitSource,
} from "@semoss/shared";

export interface UsageLimitSummaryProps {
	/** The limit after the batch is saved, or null for no limit defined */
	limit: ModelUsageLimit | null | undefined;
	/** The limit now, shown as "Was ..." when the batch changes it */
	previous?: ModelUsageLimit | null;
	/** Whether the batch changes the entry, so the limit is compared with the one now */
	isChanged: boolean;
	/** Where the limit is set, which decides how its counts are said */
	source: ModelUsageLimitSource;
}

/**
 * A usage limit's rules, one per line and joined by "and", muted for no limit
 * defined, and what it was when a batch changes it. Shown wherever a limit is
 * changed in place: Bulk Access Management, the Teams table and the model's
 * total and public use limit.
 */
export const UsageLimitSummary = ({
	limit,
	previous,
	isChanged,
	source,
}: UsageLimitSummaryProps) => (
	<span className="flex flex-col items-start text-start">
		<ModelUsageLimitRules limit={limit} source={source} />
		{isChanged && !isSameModelUsageLimit(limit, previous) ? (
			<span className="text-muted-foreground text-xs">
				Was {describeModelUsageLimit(previous, source)}
			</span>
		) : null}
	</span>
);
