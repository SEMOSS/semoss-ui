import { Schema } from "@mui/icons-material";
import { ColorSettings } from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildDimensionsSection,
	buildListener,
	buildShowField,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Schema,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Show expand iconsssss",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Show expand icon"
							path="showExpandIcon"
							description="Enable to show expand icon in accordion"
						/>
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
	],
	styleMenu: [
		buildSpacingSection(),
		buildDimensionsSection(),
		{
			name: "Color",
			children: [
				{
					description: "Summary Background Color",
					render: ({ id }) => (
						<ColorSettings
							id={id}
							label="Summary Background Color"
							path="triggerBgColor"
						/>
					),
				},
				{
					description: "Content Background Color",
					render: ({ id }) => (
						<ColorSettings
							id={id}
							label="Content Background Color"
							path="contentBgColor"
						/>
					),
				},
			],
		},
		buildBorderSection(),
	],
};
