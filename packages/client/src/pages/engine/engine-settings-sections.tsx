import {
	AlignLeftIcon,
	DownloadIcon,
	ImageIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	TagsIcon,
	TriangleAlertIcon,
} from "lucide-react";
import type { Role } from "@semoss/sdk";
import type { CatalogSettingsPanelSection } from "@/components/catalog/catalog-settings-panel";
import type { ENGINE_TYPES } from "@/types";
import { EngineDangerousSettingsPage } from "./engine-dangerous-settings-page";
import { EngineDescriptionSettingsPage } from "./engine-description-settings-page";
import { EngineExportSettingsPage } from "./engine-export-settings-page";
import { EngineGuardrailSettingsPage } from "./engine-guardrail-settings-page";
import { EngineImageSettingsPage } from "./engine-image-settings-page";
import { EngineModelSettingsPage } from "./engine-model-settings-page";
import { EngineTagsSettingsPage } from "./engine-tags-settings-page";

/** One section of an engine's Settings tab. */
export interface EngineSettingsSection extends CatalogSettingsPanelSection {
	/**
	 * Whether a viewer sees the section on an engine of a type
	 *
	 * @param type - The engine's type.
	 * @param permission - The viewer's permission on the engine.
	 */
	isAvailable: (type: ENGINE_TYPES, permission: Role) => boolean;
	/**
	 * Builds the nav description from what the catalog calls the engine, for a
	 * section that names it; the fixed description is used otherwise
	 *
	 * @param catalogName - What the catalog calls the engine, such as "Database".
	 */
	describe?: (catalogName: string) => string;
}

/** A section every engine has, for everyone who can open the Settings tab */
const isEverySection = (): boolean => true;

/** A section only a model has */
const isModelSection = (type: ENGINE_TYPES): boolean => type === "MODEL";

/** A section only the engine's owners have */
const isOwnerSection = (_type: ENGINE_TYPES, permission: Role): boolean =>
	permission === "OWNER";

/**
 * Every engine Settings section, in nav order: alphabetical by name, with
 * Dangerous always last. A new section goes in its place by name. The routes
 * declare them all; the layout shows the ones a viewer has.
 */
export const ENGINE_SETTINGS_SECTIONS: EngineSettingsSection[] = [
	{
		name: "Description",
		path: "description",
		icon: AlignLeftIcon,
		description: "Summary and About content",
		isAvailable: isEverySection,
		element: <EngineDescriptionSettingsPage />,
	},
	{
		name: "Export",
		path: "export",
		icon: DownloadIcon,
		description: "Download the engine as a zip",
		describe: (catalogName) =>
			`Download the ${catalogName.toLowerCase()} as a zip`,
		isAvailable: isOwnerSection,
		element: <EngineExportSettingsPage />,
	},
	{
		name: "Guardrails",
		path: "guardrails",
		icon: ShieldCheckIcon,
		description: "Input and output guardrail pipelines",
		isAvailable: isModelSection,
		element: <EngineGuardrailSettingsPage />,
	},
	{
		name: "Image",
		path: "image",
		icon: ImageIcon,
		description: "Catalog image",
		isAvailable: isEverySection,
		element: <EngineImageSettingsPage />,
	},
	{
		name: "Model Settings",
		path: "model",
		icon: SlidersHorizontalIcon,
		description: "Capability, modalities, and limits",
		isAvailable: isModelSection,
		element: <EngineModelSettingsPage />,
	},
	{
		name: "Tags",
		path: "tags",
		icon: TagsIcon,
		description: "Tags, classification, and domain",
		isAvailable: isEverySection,
		element: <EngineTagsSettingsPage />,
	},
	{
		name: "Dangerous",
		path: "dangerous",
		icon: TriangleAlertIcon,
		description: "Delete the engine",
		describe: (catalogName) => `Delete the ${catalogName.toLowerCase()}`,
		isAvailable: isOwnerSection,
		element: <EngineDangerousSettingsPage />,
	},
];

/**
 * The Settings sections a viewer has on an engine, in nav order, each
 * described for the engine's kind.
 *
 * @param type - The engine's type.
 * @param permission - The viewer's permission on the engine.
 * @param catalogName - What the catalog calls the engine, such as "Database".
 * @returns The sections; the first one opens by default.
 */
export const getEngineSettingsSections = (
	type: ENGINE_TYPES,
	permission: Role,
	catalogName: string,
): EngineSettingsSection[] =>
	ENGINE_SETTINGS_SECTIONS.filter((section) =>
		section.isAvailable(type, permission),
	).map((section) => ({
		...section,
		description: section.describe?.(catalogName) ?? section.description,
	}));
