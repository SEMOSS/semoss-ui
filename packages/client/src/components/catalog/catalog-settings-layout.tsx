import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router";

/** One entry in a catalog Settings tab's section nav. */
export interface CatalogSettingsSection {
	/** Section name shown in the nav. */
	name: string;
	/** Relative route path of the section. */
	path: string;
	/** Icon shown next to the name. */
	icon: LucideIcon;
	/** One-line summary shown under the name on wide screens. */
	description: string;
}

export interface CatalogSettingsLayoutProps {
	/** Sections to list, in order. */
	sections: CatalogSettingsSection[];
	/** Accessible name for the section nav. */
	ariaLabel: string;
	/** Prefix for each link's data-testid, e.g. "engine-settings-layout". */
	testIdPrefix: string;
}

/**
 * Layout for a catalog entry's Settings tab: a small left sidebar that
 * switches between the settings sections, with the active section rendered
 * beside it.
 */
export const CatalogSettingsLayout = ({
	sections,
	ariaLabel,
	testIdPrefix,
}: CatalogSettingsLayoutProps) => {
	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:gap-0">
			<nav
				aria-label={ariaLabel}
				className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto lg:w-60 lg:flex-col lg:pr-6"
			>
				{sections.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						data-testid={`${testIdPrefix}--${item.path}-link`}
						className={({ isActive }) =>
							[
								"flex shrink-0 items-start gap-3 rounded-md px-3 py-2 transition-colors",
								isActive
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
							].join(" ")
						}
					>
						<item.icon className="mt-0.5 size-4 shrink-0" />
						<span className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-sm">
								{item.name}
							</span>
							<span className="hidden truncate text-muted-foreground text-xs lg:block">
								{item.description}
							</span>
						</span>
					</NavLink>
				))}
			</nav>
			<div className="min-w-0 flex-1 lg:border-border lg:border-l lg:pl-8">
				<Outlet />
			</div>
		</div>
	);
};
