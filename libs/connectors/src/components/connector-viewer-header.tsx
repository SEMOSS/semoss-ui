import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Small } from "@semoss/ui/next";

/** Props for {@link ConnectorViewerHeader}. */
export interface ConnectorViewerHeaderProps {
	/** The app's icon. */
	icon: LucideIcon;
	/** What the viewer shows, such as the app or the open folder. */
	title: string;
	/** A line under the title, such as where the viewer is. */
	description?: string;
	/** Buttons at the end of the row, such as refresh. */
	children?: ReactNode;
}

/**
 * The top row of a connector viewer: the app, where the viewer is, and its
 * buttons.
 */
export const ConnectorViewerHeader = ({
	icon: Icon,
	title,
	description,
	children,
}: ConnectorViewerHeaderProps) => (
	// one height with or without a description, so moving between folders
	// does not shift the list
	<div className="flex min-h-12 min-w-0 items-center gap-2 border-border border-b px-3 py-2">
		<Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
		<div className="flex min-w-0 flex-1 flex-col">
			<span className="truncate font-medium text-sm" title={title}>
				{title}
			</span>
			{description ? (
				<Small
					className="truncate text-muted-foreground"
					title={description}
				>
					{description}
				</Small>
			) : null}
		</div>
		{children}
	</div>
);
