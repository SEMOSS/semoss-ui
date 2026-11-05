import {
	AlignLeftIcon,
	ArrowDownUpIcon,
	ImageIcon,
	ShareIcon,
	SquareCodeIcon,
	TagsIcon,
	TriangleAlertIcon,
} from "lucide-react";
import type { Role } from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import type { CatalogSettingsPanelSection } from "@/components/catalog/catalog-settings-panel";
import { AppImportExportSettingsPage } from "../app/app-import-export-settings-page";
import { AppPortalSettingsPage } from "../app/app-portal-settings-page";
import { AppPythonReactorsSettingsPage } from "../app/app-python-reactors-settings-page";
import { ProjectDangerousSettingsPage } from "./project-dangerous-settings-page";
import { ProjectDescriptionSettingsPage } from "./project-description-settings-page";
import { ProjectImageSettingsPage } from "./project-image-settings-page";
import { ProjectTagsSettingsPage } from "./project-tags-settings-page";

/** The project types whose owners get the app sections and app actions */
export const APP_SETTINGS_TYPES: Project["project_type"][] = [
	"CODE",
	"BLOCKS",
	"AUTOMATION",
	"INSIGHT",
];

/** One section of a project's Settings tab. */
export interface ProjectSettingsSection extends CatalogSettingsPanelSection {
	/**
	 * Whether a viewer sees the section on a project of a type
	 *
	 * @param projectType - The project's type.
	 * @param permission - The viewer's permission on the project.
	 */
	isAvailable: (
		projectType: Project["project_type"],
		permission: Role,
	) => boolean;
	/**
	 * Builds the nav description from what the catalog calls the project, for a
	 * section that names it; the fixed description is used otherwise
	 *
	 * @param catalogName - What the catalog calls the project, such as "Agent".
	 */
	describe?: (catalogName: string) => string;
}

/** An app section, for the owners of an app type */
const isAppOwnerSection = (
	projectType: Project["project_type"],
	permission: Role,
): boolean =>
	permission === "OWNER" && APP_SETTINGS_TYPES.includes(projectType);

/** A catalog section, for everyone who can open the Settings tab */
const isCatalogSection = (): boolean => true;

/** A section only the project's owners have, on every project type */
const isOwnerSection = (
	_projectType: Project["project_type"],
	permission: Role,
): boolean => permission === "OWNER";

/**
 * Every project Settings section, in nav order: alphabetical by name, with
 * Dangerous always last. A new section goes in its place by name. The routes
 * declare them all; the layout shows the ones a viewer has.
 */
export const PROJECT_SETTINGS_SECTIONS: ProjectSettingsSection[] = [
	{
		name: "Description",
		path: "description",
		icon: AlignLeftIcon,
		description: "Summary and About content",
		isAvailable: isCatalogSection,
		element: <ProjectDescriptionSettingsPage />,
	},
	{
		name: "Image",
		path: "image",
		icon: ImageIcon,
		description: "Catalog image",
		isAvailable: isCatalogSection,
		element: <ProjectImageSettingsPage />,
	},
	{
		name: "Import and Export",
		path: "import-export",
		icon: ArrowDownUpIcon,
		description: "Update from a zip or export",
		isAvailable: isAppOwnerSection,
		element: <AppImportExportSettingsPage />,
	},
	{
		name: "Portal",
		path: "portal",
		icon: ShareIcon,
		description: "Share link and published portal",
		isAvailable: isAppOwnerSection,
		element: <AppPortalSettingsPage />,
	},
	{
		name: "Python and Reactors",
		path: "python",
		icon: SquareCodeIcon,
		description: "Reload Python and deploy reactors",
		isAvailable: isAppOwnerSection,
		element: <AppPythonReactorsSettingsPage />,
	},
	{
		name: "Tags",
		path: "tags",
		icon: TagsIcon,
		description: "Tags, classification, and domain",
		isAvailable: isCatalogSection,
		element: <ProjectTagsSettingsPage />,
	},
	{
		name: "Dangerous",
		path: "dangerous",
		icon: TriangleAlertIcon,
		description: "Delete the project",
		describe: (catalogName) => `Delete the ${catalogName.toLowerCase()}`,
		isAvailable: isOwnerSection,
		element: <ProjectDangerousSettingsPage />,
	},
];

/**
 * The Settings sections a viewer has on a project, in nav order, each
 * described for the project's kind.
 *
 * @param projectType - The project's type.
 * @param permission - The viewer's permission on the project.
 * @param catalogName - What the catalog calls the project, such as "Agent".
 * @returns The sections; the first one opens by default.
 */
export const getProjectSettingsSections = (
	projectType: Project["project_type"],
	permission: Role,
	catalogName: string,
): ProjectSettingsSection[] =>
	PROJECT_SETTINGS_SECTIONS.filter((section) =>
		section.isAvailable(projectType, permission),
	).map((section) => ({
		...section,
		description: section.describe?.(catalogName) ?? section.description,
	}));
