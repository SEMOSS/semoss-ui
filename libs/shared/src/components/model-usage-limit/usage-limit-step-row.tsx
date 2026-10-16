import { Fragment } from "react";
import type {
	UsageLimitPathStep,
	UsageLimitRuleUsage,
	UsageLimitStepState,
} from "@semoss/sdk";
import { Badge, cn } from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import {
	getRuleSlotKey,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";
import {
	getUsageSourceLabel,
	getUsageStepReasonLabel,
	getUsageStepSource,
	getUsageStepStateLabel,
} from "./usage-limit-labels";
import { UsageLimitRuleMeter } from "./usage-limit-rule-meter";

/** The states of steps that do not apply, shown faded */
const FADED_STATES: readonly UsageLimitStepState[] = [
	"SKIPPED",
	"NOT_REACHED",
	"NOT_DEFINED",
];

/** The color of each state's badge */
const STATE_CLASSES: Partial<Record<UsageLimitStepState, string>> = {
	BILLED: "border-primary text-primary",
	REACHED: "border-destructive text-destructive",
	CHECKED: "text-success",
	NEXT: "text-warning",
};

/**
 * A step's rules, each with its usage bar. Every rule applies, so more than
 * one says so and puts "and" between them, as `ModelUsageLimitRules` does.
 */
const renderRuleMeters = (
	rules: readonly UsageLimitRuleUsage[],
	source: ModelUsageLimitSource,
	isFaded: boolean,
) => (
	<div className="flex flex-col gap-2">
		{rules.length > 1 ? (
			<p className="text-muted-foreground text-xs">Every rule applies.</p>
		) : null}
		{rules.map((rule, index) => (
			<Fragment key={`${getRuleSlotKey(rule)}:${index}`}>
				{index > 0 ? (
					// the sentence above says every rule applies, so the joiner is only seen
					<span
						aria-hidden
						className="font-medium text-muted-foreground text-xs uppercase"
					>
						and
					</span>
				) : null}
				<UsageLimitRuleMeter
					rule={rule}
					source={source}
					isFaded={isFaded}
				/>
			</Fragment>
		))}
	</div>
);

/** Props for {@link UsageLimitStepRow}. */
export interface UsageLimitStepRowProps {
	/** The step */
	step: UsageLimitPathStep;
	/** What a step after the limit applied says, such as "Not reached: the Data Team Limit applies" */
	notReachedNote?: string | null;
}

/**
 * One step of how usage limits apply to a person: the ceiling or source, where
 * the call stands there, and each of its rules with what is used and when it
 * resets. The step a call stops at, applied or reached, is highlighted; the
 * steps that do not apply are faded, with the reason.
 */
export const UsageLimitStepRow = ({
	step,
	notReachedNote = null,
}: UsageLimitStepRowProps) => {
	const isFaded = FADED_STATES.includes(step.state);
	const isStop = step.state === "BILLED" || step.state === "REACHED";
	const source = getUsageStepSource(step);
	const since = formatLocalDateTime(
		step.accessSince ?? undefined,
		"MMM D, YYYY",
	);
	const detail =
		step.state === "SKIPPED" && step.reason
			? getUsageStepReasonLabel(step.reason)
			: step.state === "NOT_REACHED"
				? notReachedNote
				: null;

	return (
		<li
			className={cn(
				"flex flex-col gap-2 rounded-md border border-border p-3",
				isStop &&
					(step.state === "REACHED"
						? "border-destructive bg-destructive/5"
						: "border-primary bg-primary/5"),
			)}
			aria-current={isStop ? "step" : undefined}
		>
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="flex min-w-0 flex-col">
					<span
						className={cn(
							"wrap-break-word font-medium text-sm",
							isFaded && "text-muted-foreground",
						)}
					>
						{getUsageSourceLabel(step.limitType, step.id)}
					</span>
					{step.limitType === "TEAM" ? (
						<span className="text-muted-foreground text-xs">
							{since ? `Access since ${since}` : "Team"}
						</span>
					) : null}
				</div>
				<Badge
					variant="outline"
					className={
						STATE_CLASSES[step.state] ?? "text-muted-foreground"
					}
				>
					{getUsageStepStateLabel(step.state)}
				</Badge>
			</div>
			{detail ? (
				<p className="text-muted-foreground text-xs">{detail}</p>
			) : null}
			{step.unlimited ? (
				<p
					className={cn(
						"text-sm",
						isFaded && "text-muted-foreground",
					)}
				>
					Unlimited
				</p>
			) : step.rulesHidden ? (
				<p className="text-muted-foreground text-xs">
					Only admins can see this limit's rules
				</p>
			) : step.rules.length > 0 ? (
				renderRuleMeters(step.rules, source, isFaded)
			) : step.state !== "NOT_DEFINED" && step.state !== "NOT_REACHED" ? (
				<p className="text-muted-foreground text-sm">
					No Limit Defined
				</p>
			) : null}
			{step.teamTotal &&
			(step.teamTotal.unlimited || step.teamTotal.rules.length > 0) ? (
				<div className="flex flex-col gap-2 border-border border-s-2 ps-3">
					<span className="font-medium text-muted-foreground text-xs">
						Team Total, Across All Models
					</span>
					{step.teamTotal.unlimited ? (
						<p className="text-sm">Unlimited</p>
					) : (
						renderRuleMeters(
							step.teamTotal.rules,
							"TEAM_TOTAL",
							isFaded,
						)
					)}
				</div>
			) : null}
		</li>
	);
};
