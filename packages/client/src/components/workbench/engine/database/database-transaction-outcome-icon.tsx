import {
	AlertCircle,
	CircleCheck,
	type LucideIcon,
	TriangleAlert,
} from "lucide-react";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type {
	DatabaseTransactionOutcome,
	DatabaseTransactionSummary,
} from "@/stores/workbench/database/database-workbench.store";

/** How one outcome reads in the results header. */
interface OutcomeDisplay {
	/**
	 * The words the icon is read as: Single transaction, with what went wrong
	 * when it did not commit, so the outcome never rests on color alone.
	 */
	title: string;
	/** The icon drawn for the outcome. */
	icon: LucideIcon;
	/** The status color of the icon. */
	className: string;
}

const OUTCOME_DISPLAY: Record<DatabaseTransactionOutcome, OutcomeDisplay> = {
	COMMITTED: {
		title: "Single transaction",
		icon: CircleCheck,
		className: "text-success",
	},
	ROLLED_BACK: {
		title: "Single transaction, rolled back",
		icon: AlertCircle,
		className: "text-destructive",
	},
	UNKNOWN: {
		title: "Single transaction, outcome unknown",
		icon: TriangleAlert,
		className: "text-warning",
	},
};

/** Props for {@link DatabaseTransactionOutcomeIcon}. */
export interface DatabaseTransactionOutcomeIconProps {
	/** What the script left in the database, and the backend's message about it. */
	transaction: DatabaseTransactionSummary;
}

/**
 * Marks results that came from a script run in one transaction: a small icon
 * to the left of the results title, colored by what the transaction left in the
 * database. Hovering it shows the outcome and the backend's message, such as how
 * many statements were committed together. The workbench draws the header in a
 * dock tab or a border bar, so the icon is not a control of its own; its label
 * gives screen readers the same words.
 */
export const DatabaseTransactionOutcomeIcon = ({
	transaction,
}: DatabaseTransactionOutcomeIconProps) => {
	const display = OUTCOME_DISPLAY[transaction.outcome];
	const Icon = display.icon;

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<span
					role="img"
					aria-label={`${display.title}: ${transaction.message}`}
					className={cn("inline-flex flex-none", display.className)}
					data-testid="query-transaction-outcome"
				>
					<Icon aria-hidden size={13} />
				</span>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs">
				<p className="font-medium">{display.title}</p>
				<p>{transaction.message}</p>
			</TooltipContent>
		</Tooltip>
	);
};
