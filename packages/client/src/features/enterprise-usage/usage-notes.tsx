import { Info } from "lucide-react";
import type { ReactElement } from "react";
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Props for {@link UsageNotes}. */
export interface UsageNotesProps {
	/** What the notes are about, which names the button and the popover, such as "Activity Log" */
	title: string;
	/** How to read it, one short point each */
	notes: readonly string[];
}

/**
 * How to read a view or a figure, behind an info button beside its title, so
 * the view shows its data rather than paragraphs about it. The notes open in a
 * popover on click and close on Escape or a click outside.
 */
export function UsageNotes({ title, notes }: UsageNotesProps): ReactElement {
	return (
		<Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="text-muted-foreground hover:text-foreground"
							aria-label={`About ${title}`}
						>
							<Info aria-hidden="true" />
						</Button>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent>About {title}</TooltipContent>
			</Tooltip>
			<PopoverContent align="start" className="w-80 space-y-2">
				<p className="font-medium text-sm">About {title}</p>
				<ul className="list-disc space-y-1 pl-4 text-muted-foreground text-xs">
					{notes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
