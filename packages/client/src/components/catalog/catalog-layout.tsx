import { Help } from "@/components/help";

export interface CatalogLayoutProps {
	/** Main title for the catalog page */
	title: string;
	/** Optional description text */
	description?: string;
	/** Action to show in the header */
	headerActions?: React.ReactNode;
	/** Search bar content */
	searchBar: React.ReactNode;
	/** Tabs content */
	tabs?: React.ReactNode;
	/** Main content area */
	children: React.ReactNode;
	/** Filter box content - if provided, shows the filter box */
	filterBox?: React.ReactNode;
}

/**
 * Catalog Layout Component
 * Main layout wrapper that combines all catalog components
 * Follows the clean structure from engine-index-page
 */
export const CatalogLayout = ({
	title,
	description,
	headerActions = null,
	searchBar,
	tabs,
	children,
	filterBox,
}: CatalogLayoutProps) => {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
					<p className="font-semibold text-3xl leading-normal">
						{title}
					</p>
					{headerActions}
				</div>
				{description && (
					<div className="flex flex-row items-center justify-between gap-8 pt-2.5">
						<p className="font-weight-normal text-md text-muted-foreground leading-normal">
							{description}
						</p>
					</div>
				)}
			</div>
			{searchBar}
			<div className="flex flex-col gap-6 pt-2 pb-2 md:h-full md:flex-row">
				{filterBox && (
					<div className="md:sticky md:top-4 md:self-start">
						{filterBox}
					</div>
				)}
				<div className="flex w-full flex-1 flex-col gap-6 overflow-x-hidden">
					{tabs}
					{children}
				</div>
			</div>
			<Help />
		</div>
	);
};
