import { InsertEmoticon } from "@mui/icons-material";
import { ColorSettings } from "../../settings";
import {
	IconSelectSettings,
	inputOptions,
} from "../../settings/custom/IconSelectSettings";
import { IconGeneralSettings } from "../../settings/shared/IconGeneralSettings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildShowField,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: InsertEmoticon,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Icon",
					render: ({ id }) => (
						<IconSelectSettings
							id={id}
							label="Icon"
							path="icon"
							options={inputOptions}
						/>
					),
				},

				{
					description: "Badge Settings",
					render: ({ id }) => <IconGeneralSettings id={id} />,
				},
			],
		},
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
	],
	styleMenu: [
		{
			name: "Color",
			children: [
				{
					description: "Color",
					render: ({ id }) => (
						<ColorSettings
							id={id}
							label="Color"
							path="style.color"
						/>
					),
				},
			],
		},
		buildDimensionsSection(),
	],
};
