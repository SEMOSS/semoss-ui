import type { LucideIcon } from "lucide-react";
import { H3, P } from "@semoss/ui/next";

interface PanelEmptyStateProps {
	/** A glyph for the kind of thing that is missing. */
	icon?: LucideIcon;
	/** A headline, for a state that is the panel's whole content. */
	title?: string;
	/** What the user is looking at nothing for. */
	message: string;
}

/**
 * What a left-rail panel shows in place of an empty list.
 *
 * Shared by Blocks, Layers, Variables and Notebooks so that "nothing here" and
 * "nothing matched your search" read the same wherever the user hits them.
 * Filtering to no results used to leave two of those panels simply blank, with
 * nothing to say whether the list was empty or the search was too narrow.
 *
 * @param props - The glyph and the line to show.
 * @return The centred empty state.
 */
export const PanelEmptyState = ({
	icon: Icon,
	title,
	message,
}: PanelEmptyStateProps) => (
	<div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
		{Icon ? (
			<Icon aria-hidden className="size-5 text-muted-foreground" />
		) : null}
		{title ? (
			<H3 className="font-bold text-foreground text-sm">{title}</H3>
		) : null}
		<P className="text-muted-foreground text-xs leading-5">{message}</P>
	</div>
);
