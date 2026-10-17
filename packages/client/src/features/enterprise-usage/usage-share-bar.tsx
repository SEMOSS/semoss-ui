import type { ReactElement } from "react";
import {
	Progress,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatMetric } from "./usage-metrics";

/** Props for {@link UsageShareBar}. */
export interface UsageShareBarProps {
	/** Whom the bar is for, in its accessible name and tooltip */
	name: string;
	/** What the bar measures, in its accessible name, such as "Tokens" or "Cost" */
	measure: string;
	/** What the total is, as the tooltip says it, such as "All Tokens In The Period" */
	totalLabel: string;
	/** The consumer's amount */
	value: number;
	/** The amount the share is of, the bar's full length */
	total: number;
	/** The lines the tooltip shows under the name, such as the totals */
	details: readonly string[];
}

/**
 * A consumer's share of a total as a bar, so the bars of all consumers add up
 * to at most a full bar, with its totals and its share in a tooltip. The bar is
 * focusable, so the tooltip opens from the keyboard too, and a screen reader
 * hears its share and what it is of.
 */
export function UsageShareBar({
	name,
	measure,
	totalLabel,
	value,
	total,
	details,
}: UsageShareBarProps): ReactElement {
	const share = total > 0 ? Math.min((value / total) * 100, 100) : 0;
	const shareText = `${formatMetric(share, 1)}% Of ${totalLabel}`;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Progress
					value={share}
					aria-label={`${name} Share Of ${measure}`}
					aria-valuetext={shareText}
					className="w-24 focus-visible:outline-2 focus-visible:outline-ring"
					tabIndex={0}
				/>
			</TooltipTrigger>
			<TooltipContent>
				<div>{name}</div>
				{details.map((detail) => (
					<div key={detail}>{detail}</div>
				))}
				<div>{shareText}</div>
			</TooltipContent>
		</Tooltip>
	);
}
