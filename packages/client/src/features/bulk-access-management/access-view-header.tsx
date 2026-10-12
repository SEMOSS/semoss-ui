import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import {
	Button,
	H2,
	H3,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

export interface AccessViewHeaderProps {
	/** The view's title, such as "Bulk Access Management" */
	title: string;
	/** What the view is for, under the title */
	description: ReactNode;
	/** Where the page the view was opened from is, relative to the view */
	backTo: string;
	/** What going back is called, such as "Back to Members" */
	backLabel: string;
	/** Buttons beside the title, such as Refresh and Review */
	actions?: ReactNode;
	/** The title's heading level: 3 when the view sits under a page's own heading */
	headingLevel?: 2 | 3;
}

/**
 * The header of a view opened from an access page, such as Bulk Access Management:
 * a back button beside the title, the description under it, and the view's
 * buttons on the right. The buttons stay on one line; the description wraps.
 */
export const AccessViewHeader = ({
	title,
	description,
	backTo,
	backLabel,
	actions,
	headingLevel = 2,
}: AccessViewHeaderProps) => {
	const Heading = headingLevel === 3 ? H3 : H2;
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
			<div className="flex min-w-0 flex-1 items-start gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							asChild
							variant="ghost"
							size="icon-sm"
							className="mt-0.5"
						>
							<Link
								to={backTo}
								relative="path"
								aria-label={backLabel}
							>
								<ArrowLeft className="size-4" aria-hidden />
							</Link>
						</Button>
					</TooltipTrigger>
					<TooltipContent>{backLabel}</TooltipContent>
				</Tooltip>
				<div className="flex min-w-0 flex-col gap-1">
					<Heading
						className={
							headingLevel === 3
								? "font-medium text-lg"
								: "font-medium text-xl"
						}
					>
						{title}
					</Heading>
					<P className="text-muted-foreground text-sm">
						{description}
					</P>
				</div>
			</div>
			{actions ? (
				<div className="flex flex-wrap gap-2 md:shrink-0 md:flex-nowrap">
					{actions}
				</div>
			) : null}
		</div>
	);
};
