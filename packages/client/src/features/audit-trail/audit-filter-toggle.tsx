import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { ReactElement } from "react";
import { Badge, Button, CollapsibleTrigger } from "@semoss/ui/next";

interface AuditFilterToggleProps {
	/** Expanded state of the enclosing filter panel. */
	open: boolean;
	/** Number of filters applied to the current query. */
	activeFilterCount: number;
}

/** Shared filter trigger for the admin and resource audit tables. */
export function AuditFilterToggle({
	open,
	activeFilterCount,
}: AuditFilterToggleProps): ReactElement {
	return (
		<CollapsibleTrigger asChild>
			<Button variant="outline" aria-label="Audit filters">
				<SlidersHorizontal aria-hidden="true" className="size-4" />
				Filters
				{activeFilterCount > 0 && (
					<Badge variant="secondary">{activeFilterCount}</Badge>
				)}
				<ChevronDown
					aria-hidden="true"
					className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</Button>
		</CollapsibleTrigger>
	);
}
