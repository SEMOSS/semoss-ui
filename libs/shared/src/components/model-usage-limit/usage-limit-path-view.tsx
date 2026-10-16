import { useId } from "react";
import type { UsageLimitPath } from "@semoss/sdk";
import { cn } from "@semoss/ui/next";
import {
	CEILINGS_INTRO,
	LIMIT_APPLIED_BY_INTRO,
} from "./usage-limit-guide-content";
import { getUsageSourceLabel } from "./usage-limit-labels";
import { UsageLimitStepRow } from "./usage-limit-step-row";

/** A section heading of the path */
const SECTION_TITLE_CLASS =
	"font-medium text-muted-foreground text-xs uppercase tracking-wide";

/** Props for {@link UsageLimitPathView}. */
export interface UsageLimitPathViewProps {
	/** How the limits apply to the person, from `getUsageLimitPath` or `getMyUsageLimitPath` */
	path: UsageLimitPath;
	/** Whether the path is the signed in person's own, so it says "your" */
	isOwn?: boolean;
	/** The section headings' level, under the host's own title */
	headingLevel?: 3 | 4;
	/** Classes for the view */
	className?: string;
}

/**
 * How usage limits apply to one person on one model, the same everywhere it
 * shows: the ceilings every call must be within, then each source in the order
 * it is tried, with each rule's use and when it resets in the browser's time
 * zone. The step the call stops at is highlighted: billed here, or reached when
 * it refuses the call.
 */
export const UsageLimitPathView = ({
	path,
	isOwn = false,
	headingLevel = 3,
	className,
}: UsageLimitPathViewProps) => {
	const ceilingsId = useId();
	const stepsId = useId();
	const Heading = headingLevel === 3 ? "h3" : "h4";
	const reached = [...path.ceilings, ...path.steps].find(
		(step) => step.state === "REACHED",
	);
	const billed = path.steps.find((step) => step.state === "BILLED");
	const billedLabel = billed
		? getUsageSourceLabel(billed.limitType, billed.id)
		: null;
	const whose = isOwn ? "Your calls" : "Calls";
	const summary = reached
		? `${whose} are refused: the ${getUsageSourceLabel(reached.limitType, reached.id)} has been reached.`
		: billedLabel
			? `The ${billedLabel} applies to ${isOwn ? "your" : "these"} calls.`
			: `No limit applies to ${isOwn ? "your" : "these"} calls${path.ceilings.length > 0 ? " beyond the ceilings" : ""}.`;
	const notReachedNote = billedLabel
		? `Not reached: the ${billedLabel} applies`
		: "Not reached";

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<p className="text-sm">{summary}</p>
			{path.ceilings.length > 0 ? (
				<section
					aria-labelledby={ceilingsId}
					className="flex flex-col gap-2"
				>
					<Heading id={ceilingsId} className={SECTION_TITLE_CLASS}>
						Ceilings
					</Heading>
					<p className="text-muted-foreground text-xs">
						{CEILINGS_INTRO}
					</p>
					<ol className="flex flex-col gap-2">
						{path.ceilings.map((step) => (
							<UsageLimitStepRow
								key={`${step.limitType}:${step.type ?? ""}:${step.id ?? ""}`}
								step={step}
							/>
						))}
					</ol>
				</section>
			) : null}
			<section aria-labelledby={stepsId} className="flex flex-col gap-2">
				<Heading id={stepsId} className={SECTION_TITLE_CLASS}>
					Limit Applied By
				</Heading>
				<p className="text-muted-foreground text-xs">
					{LIMIT_APPLIED_BY_INTRO}
				</p>
				<ol className="flex flex-col gap-2">
					{path.steps.map((step) => (
						<UsageLimitStepRow
							key={`${step.limitType}:${step.type ?? ""}:${step.id ?? ""}`}
							step={step}
							notReachedNote={notReachedNote}
						/>
					))}
				</ol>
			</section>
			<p className="text-muted-foreground text-xs">
				Times are shown in your time zone.
			</p>
		</div>
	);
};
