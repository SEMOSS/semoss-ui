import { ChevronDown, ChevronUp } from "lucide-react";
import {
	Button,
	CollapsibleTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Inline disclosure control shared by source emails and read-only draft previews. */
export function EmailCollapseButton({
	isExpanded,
	subject,
}: {
	isExpanded: boolean;
	subject: string;
}) {
	const label = `${isExpanded ? "Collapse" : "Expand"} email: ${subject}`;
	const Icon = isExpanded ? ChevronUp : ChevronDown;
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="pointer-coarse:size-11"
						aria-label={label}
					>
						<Icon aria-hidden="true" />
					</Button>
				</CollapsibleTrigger>
			</TooltipTrigger>
			<TooltipContent>
				{isExpanded ? "Collapse email" : "Expand email"}
			</TooltipContent>
		</Tooltip>
	);
}
