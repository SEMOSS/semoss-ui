import { AlignLeftIcon, ImageIcon, TagsIcon } from "lucide-react";
import {
	CatalogSettingsLayout,
	type CatalogSettingsSection,
} from "@/components/catalog";

const SETTINGS_SECTIONS: CatalogSettingsSection[] = [
	{
		name: "Image",
		path: "image",
		icon: ImageIcon,
		description: "Catalog image",
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
		description: "Catalog summary",
	},
];

/** Layout for the agent Settings tab, switching between its sections. */
export const AgentSettingsLayout = () => (
	<CatalogSettingsLayout
		sections={SETTINGS_SECTIONS}
		ariaLabel="Agent settings sections"
		testIdPrefix="agent-settings-layout"
	/>
);
