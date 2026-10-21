import type { UsageLimitRuleUsage } from "@semoss/sdk";
import { cn, Progress } from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import {
	describeModelUsageRule,
	formatUsageAmount,
	getUsageShareStatus,
	getUsedPercent,
	type ModelUsageLimitSource,
	USAGE_SHARE_STATUS_LABELS,
} from "./model-usage-limit-format";

/** Props for {@link UsageLimitRuleMeter}. */
export interface UsageLimitRuleMeterProps {
	/** The rule, with what is used */
	rule: UsageLimitRuleUsage;
	/** Where its limit is set, which decides how its counts are said */
	source: ModelUsageLimitSource;
	/** Whether the step does not apply, so the rule is shown faded */
	isFaded?: boolean;
}

/**
 * One rule of a usage limit step: the rule in words, a bar of how much of it is
 * used, and when its window starts again, in the browser's time zone.
 */
export const UsageLimitRuleMeter = ({
	rule,
	source,
	isFaded = false,
}: UsageLimitRuleMeterProps) => {
	const amount = rule.amount;
	const share =
		rule.used !== null && amount !== null && amount > 0
			? Math.min(1, rule.used / amount)
			: null;
	// a rule with plenty left says nothing; the bar shows how much is used
	const status = share === null ? null : getUsageShareStatus(share);
	const resetsAt = formatLocalDateTime(
		rule.resetsAt ?? undefined,
		"MMM D, YYYY [at] h:mm A",
	);

	return (
		<div
			className={cn(
				"flex flex-col gap-1",
				isFaded && "text-muted-foreground",
			)}
		>
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
				<span>{describeModelUsageRule(rule, source)}</span>
				{rule.used !== null ? (
					<span className="text-muted-foreground text-xs">
						{formatUsageAmount(rule.metric, rule.used)} used
						{status ? (
							<span
								className={cn(
									"ms-2 font-medium",
									status === "USED_UP"
										? "text-destructive"
										: "text-warning",
								)}
							>
								{USAGE_SHARE_STATUS_LABELS[status]}
							</span>
						) : null}
					</span>
				) : null}
			</div>
			{share !== null ? (
				<Progress
					value={share * 100}
					aria-label={`${getUsedPercent(share)}% used`}
					className="h-1.5"
				/>
			) : null}
			{resetsAt ? (
				<span className="text-muted-foreground text-xs">
					Resets {resetsAt}
				</span>
			) : null}
		</div>
	);
};
