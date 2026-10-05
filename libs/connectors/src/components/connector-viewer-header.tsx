import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { type ConnectorBrand, ConnectorBrandIcon } from "@semoss/shared";
import { Small } from "@semoss/ui/next";

/** Props for {@link ConnectorViewerHeader}. */
export interface ConnectorViewerHeaderProps {
	/** The app's icon. */
	icon: LucideIcon;
	/** The service logo, when this header identifies a connector. */
	brand?: ConnectorBrand;
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
	brand,
	title,
	description,
	children,
}: ConnectorViewerHeaderProps) => (
	// Keep the toolbar compact; context shares the title line when space allows.
	<div className="@container/header flex min-h-10 min-w-0 shrink-0 items-center gap-2 border-border border-b bg-muted/30 px-3 py-1">
		{brand ? (
			<ConnectorBrandIcon brand={brand} className="size-5 shrink-0" />
		) : (
			<Icon
				aria-hidden
				className="size-4 shrink-0 text-muted-foreground"
			/>
		)}
		<div className="flex min-w-0 flex-1 @sm/header:flex-row flex-col @sm/header:items-center @sm/header:gap-2">
			<span className="truncate font-medium text-sm" title={title}>
				{title}
			</span>
			{description ? (
				<Small
					className="truncate text-muted-foreground text-xs"
					title={description}
				>
					{description}
				</Small>
			) : null}
		</div>
		{children}
	</div>
);
