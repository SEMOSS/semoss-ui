import type { ModelUsageLimit } from "@semoss/sdk";
import { cn } from "@semoss/ui/next";
import {
	describeModelUsageRule,
	getRuleSlotKey,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";

/** Props for {@link ModelUsageLimitRules}. */
export interface ModelUsageLimitRulesProps {
	/** The limit, or null when there is none */
	limit: ModelUsageLimit | null | undefined;
	/** Where it is set, which decides how its counts are said */
	source: ModelUsageLimitSource;
	/** What to say when there is no limit */
	emptyLabel?: string;
	/** Classes for the list, or for the text when there are no rules */
	className?: string;
}

/**
 * A usage limit's rules, one per line, each after the first starting with
 * "and", since every rule applies: a call must be within all of them. No limit
 * and Unlimited are muted. It is made of spans, so it can sit inside a button.
 */
export const ModelUsageLimitRules = ({
	limit,
	source,
	emptyLabel = "No Limit Defined",
	className,
}: ModelUsageLimitRulesProps) => {
	if (!limit || (!limit.unlimited && limit.rules.length === 0)) {
		return (
			<span className={cn("text-muted-foreground", className)}>
				{emptyLabel}
			</span>
		);
	}
	if (limit.unlimited) {
		return (
			<span className={cn("text-muted-foreground", className)}>
				Unlimited
			</span>
		);
	}
	return (
		<span className={cn("flex flex-col gap-0.5 text-start", className)}>
			{limit.rules.map((rule, index) => (
				<span key={`${getRuleSlotKey(rule)}:${index}`}>
					{index > 0 ? (
						<span className="me-1 font-medium text-muted-foreground text-xs uppercase">
							and
						</span>
					) : null}
					{describeModelUsageRule(rule, source)}
				</span>
			))}
		</span>
	);
};
