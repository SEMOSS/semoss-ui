import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { formatToDataTestId } from "@/utility";

export interface CatalogTabsProps {
	/** Current active tab value */
	value: string;
	/** Callback when tab changes */
	onValueChange: (value: string) => void;
	/** Available tab options */
	tabs: {
		value: string;
		label: string;
		dataTestId: string;
	}[];
}

/**
 * Catalog Tabs Component
 * Simple tab navigation following the engine-index-page style
 */
export const CatalogTabs = ({
	value,
	onValueChange,
	tabs,
}: CatalogTabsProps) => {
	return (
		<div className="flex flex-row flex-wrap items-center justify-between gap-2">
			<Tabs value={value} onValueChange={onValueChange}>
				<TabsList>
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							data-testid={formatToDataTestId(tab.dataTestId)}
						>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
};
