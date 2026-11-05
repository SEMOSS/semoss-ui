export interface CatalogSettingsFrameProps {
	/** Accessible name for the section nav */
	ariaLabel: string;
	/** The nav entries, one per section */
	nav: React.ReactNode;
	/** The section shown */
	children: React.ReactNode;
}

/**
 * The frame every Settings view shares: the section nav on the left with the
 * section shown beside it, or the nav as a scrolling row above the section
 * when the frame is narrow. It sizes to its own width, so it lays out the same
 * on a page and in a workbench panel.
 */
export const CatalogSettingsFrame = ({
	ariaLabel,
	nav,
	children,
}: CatalogSettingsFrameProps) => (
	<div className="@container w-full">
		<div className="flex @3xl:flex-row flex-col @3xl:gap-0 gap-6">
			<nav
				aria-label={ariaLabel}
				className="flex @3xl:w-60 w-full shrink-0 flex-row @3xl:flex-col gap-1 overflow-x-auto @3xl:pr-6"
			>
				{nav}
			</nav>
			<div className="min-w-0 flex-1 @3xl:border-border @3xl:border-l @3xl:pl-8">
				{children}
			</div>
		</div>
	</div>
);
