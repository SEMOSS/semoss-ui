import type { LucideIcon } from "lucide-react";
import {
	Navigate,
	NavLink,
	Outlet,
	useLocation,
	useResolvedPath,
} from "react-router";
import { CatalogSettingsFrame } from "./catalog-settings-frame";
import {
	CatalogSettingsNavItemContent,
	getCatalogSettingsNavItemClassName,
} from "./catalog-settings-nav-item";

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
	/** Sections the viewer can open, in order. The first one opens by default. */
	sections: CatalogSettingsSection[];
	/** Accessible name for the section nav. */
	ariaLabel: string;
	/** Prefix for each link's data-testid, e.g. "engine-settings-layout". */
	testIdPrefix: string;
}

/**
 * Reads the segments of a path below the layout's own path: the section it
 * opens first, then anything below the section. The tab itself has none.
 *
 * @param pathname - The current path.
 * @param basePath - The layout's own path.
 * @returns The segments below the layout's path, in order.
 */
const getSegmentsBelow = (pathname: string, basePath: string): string[] => {
	const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
	if (!pathname.startsWith(base)) {
		return [];
	}
	return pathname.slice(base.length).split("/").filter(Boolean);
};

/**
 * Layout for a catalog entry's Settings tab: a small left sidebar that
 * switches between the settings sections, with the active section rendered
 * beside it. A path that opens no section, or one the viewer cannot open,
 * goes to the first section, and a path below a section goes to the section.
 */
export const CatalogSettingsLayout = ({
	sections,
	ariaLabel,
	testIdPrefix,
}: CatalogSettingsLayoutProps) => {
	const { pathname } = useLocation();
	const basePath = useResolvedPath(".").pathname;
	const [sectionPath = "", ...belowSection] = getSegmentsBelow(
		pathname,
		basePath,
	);
	const [firstSection] = sections;
	const isSection = sections.some((section) => section.path === sectionPath);

	if (firstSection && !isSection) {
		return <Navigate to={firstSection.path} replace />;
	}
	// a section has no pages below it
	if (isSection && belowSection.length > 0) {
		return <Navigate to={sectionPath} replace />;
	}

	return (
		<CatalogSettingsFrame
			ariaLabel={ariaLabel}
			nav={sections.map((section) => (
				<NavLink
					key={section.path}
					to={section.path}
					data-testid={`${testIdPrefix}--${section.path}-link`}
					className={({ isActive }) =>
						getCatalogSettingsNavItemClassName(isActive)
					}
				>
					<CatalogSettingsNavItemContent section={section} />
				</NavLink>
			))}
		>
			<Outlet />
		</CatalogSettingsFrame>
	);
};
