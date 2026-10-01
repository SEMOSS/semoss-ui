import {
	AlignLeftIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	TagsIcon,
} from "lucide-react";
import {
	CatalogSettingsLayout,
	type CatalogSettingsSection,
} from "@/components/catalog";

const SETTINGS_SECTIONS: CatalogSettingsSection[] = [
	{
		name: "Model Settings",
		path: "model",
		icon: SlidersHorizontalIcon,
		description: "Capability, modalities, and limits",
	},
	{
		name: "Tags",
		path: "tags",
		icon: TagsIcon,
		description: "Tags, classification, and domain",
	},
	{
		name: "Description",
		path: "description",
		icon: AlignLeftIcon,
		description: "Summary and About content",
	},
	{
		name: "Guardrails",
		path: "guardrails",
		icon: ShieldCheckIcon,
		description: "Input and output guardrail pipelines",
	},
];

/**
 * Layout for the engine Settings tab: a small left sidebar that switches
 * between the settings sections, with the active section rendered beside it.
 */
export const EngineSettingsLayout = () => (
	<CatalogSettingsLayout
		sections={SETTINGS_SECTIONS}
		ariaLabel="Engine settings sections"
		testIdPrefix="engine-settings-layout"
	/>
);
