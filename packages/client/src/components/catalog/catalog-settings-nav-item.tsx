import { cn } from "@semoss/ui/next";
import type { CatalogSettingsSection } from "./catalog-settings-layout";

/**
 * Classes for one entry in a Settings section nav, the same for a link and a
 * button so the routed and the panel nav look alike.
 *
 * @param isActive - Whether the entry is the section shown.
 * @returns The entry's classes.
 */
export const getCatalogSettingsNavItemClassName = (isActive: boolean): string =>
	cn(
		"flex shrink-0 items-start gap-3 rounded-md px-3 py-2 text-left transition-colors",
		isActive
			? "bg-muted text-foreground"
			: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
	);

export interface CatalogSettingsNavItemContentProps {
	/** The section the entry opens */
	section: CatalogSettingsSection;
}

/**
 * The inside of one Settings section nav entry: the section's icon and name,
 * with its one-line summary under the name when the frame is wide.
 */
export const CatalogSettingsNavItemContent = ({
	section,
}: CatalogSettingsNavItemContentProps) => (
	<>
		<section.icon className="mt-0.5 size-4 shrink-0" aria-hidden />
		<span className="flex min-w-0 flex-col">
			<span className="truncate font-medium text-sm">{section.name}</span>
			<span className="@3xl:block hidden truncate text-muted-foreground text-xs">
				{section.description}
			</span>
		</span>
	</>
);
