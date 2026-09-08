import { Help } from "@/components/help";

interface CatalogLayoutProps {
	/** Main title for the catalog page */
	title: string;
	/** Optional description text */
	description?: string;
	/** Action to show in the header */
	headerActions?: React.ReactNode;
	/** Primary task rendered between the page introduction and catalog tools. */
	primaryTask?: React.ReactNode;
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
	primaryTask,
	searchBar,
	tabs,
	children,
	filterBox,
}: CatalogLayoutProps) => {
	return (
		<div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
					<p className="font-semibold font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
						{title}
					</p>
					{headerActions}
				</div>
				{description && (
					<div className="flex flex-row items-center justify-between gap-8 pt-2.5">
						<p className="max-w-3xl font-normal text-muted-foreground text-xs leading-relaxed sm:text-sm">
							{description}
						</p>
					</div>
				)}
			</div>
			{primaryTask}
			{searchBar}
			<div className="flex flex-col gap-6 md:h-full md:flex-row md:items-start md:gap-8">
				{filterBox && (
					<div className="w-full md:sticky md:top-4 md:w-64 md:shrink-0 md:self-start">
						{filterBox}
					</div>
				)}
				<div className="flex w-full min-w-0 flex-1 flex-col gap-4 overflow-x-hidden">
					{tabs}
					{children}
				</div>
			</div>
			<Help />
		</div>
	);
};
