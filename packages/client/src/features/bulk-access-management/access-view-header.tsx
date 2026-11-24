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

interface AccessViewHeaderProps {
	/** The view's title, such as "Bulk Access Management" */
	title: string;
	/** What the view is for, under the title */
	description: ReactNode;
	/**
	 * Where the page the view was opened from is, relative to the view. A view
	 * that sits in its page, rather than opening from it, has no back button.
	 */
	backTo?: string;
	/** What going back is called, such as "Back to Members" */
	backLabel?: string;
	/** Buttons beside the title, such as Refresh and Review */
	actions?: ReactNode;
	/** The title's heading level: 3 when the view sits under a page's own heading */
	headingLevel?: 2 | 3;
}

/**
 * The header of a view opened from an access page, such as Bulk Access Management:
 * a back button beside the title, the description under it, and the view's
 * buttons. The header follows its own width (a container query), not the
 * screen's, so it also fits a view shown beside a list: when it is wide, the
 * buttons sit on the right on one line; when it is narrow, they wrap under the
 * description, which keeps the full width.
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
		<div className="@container w-full">
			<div className="flex @4xl:flex-row flex-col @4xl:items-start @4xl:justify-between @4xl:gap-6 gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-2">
					{/* the back button is centered on the title's first line, 28px tall at both heading levels */}
					{backTo ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									asChild
									variant="ghost"
									size="icon-sm"
									className="-my-0.5"
								>
									<Link
										to={backTo}
										relative="path"
										aria-label={backLabel}
									>
										<ArrowLeft
											className="size-4"
											aria-hidden
										/>
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>{backLabel}</TooltipContent>
						</Tooltip>
					) : null}
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
					<div className="flex @4xl:shrink-0 flex-wrap @4xl:flex-nowrap gap-2">
						{actions}
					</div>
				) : null}
			</div>
		</div>
	);
};
