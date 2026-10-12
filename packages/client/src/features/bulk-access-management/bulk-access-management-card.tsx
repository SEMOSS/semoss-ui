import { SlidersHorizontal } from "lucide-react";
import { Link } from "react-router";
import { P } from "@semoss/ui/next";

export interface BulkAccessManagementCardProps {
	/** Where Bulk Access Management is, relative to the page the card is on */
	to: string;
	/** What it changes access to, such as "app" or "engine" or "team" */
	noun: string;
	/** What the user can do there, after "Open Bulk Access Management for this <noun> to" */
	description?: string;
}

/**
 * Points from an access page to Bulk Access Management, where many changes are
 * made, copied from elsewhere and reviewed before they are saved.
 */
export const BulkAccessManagementCard = ({
	to,
	noun,
	description = "make many changes at once, copy access from another app or engine, and review everything before it is saved",
}: BulkAccessManagementCardProps) => (
	<div className="flex w-full items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
		<SlidersHorizontal
			className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground"
			aria-hidden
		/>
		<div className="flex flex-col gap-1">
			<span className="font-semibold text-sm">
				Detailed Access Configuration
			</span>
			<P className="text-muted-foreground text-sm">
				<Link
					to={to}
					relative="path"
					className="text-primary underline underline-offset-4 hover:text-primary/80"
				>
					Open Bulk Access Management
				</Link>{" "}
				for this {noun} to {description}.
			</P>
		</div>
	</div>
);
