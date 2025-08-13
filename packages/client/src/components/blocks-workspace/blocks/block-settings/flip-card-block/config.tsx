import { HighlightAlt } from "@mui/icons-material";
import { ColorSettings, SwitchSettings } from "../../settings/shared";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildDimensionsSection,
	buildLayoutSection,
	buildListener,
	buildPositionSection,
	buildShowField,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// TODO:
// -------------------------------------------------------------
// 1. So maybe the Flip cards height should have the default height set to auto, in order to let the child els to dictate the height of the card
// 2. Maybe we want the Flip behavior to only happen on click vs hover add settings to allow that
// 3. Event listeners Flip Card, onClick onHover
// 4. Reorganize settings
// -------------------------------------------------------------

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: HighlightAlt,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Flip back",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Flip back"
							path="isFlipped"
							description="Enable to flip back the card"
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
		buildLayoutSection(),
		buildPositionSection(),
		buildSpacingSection(),
		buildDimensionsSection(),
		buildBorderSection(),
		{
			name: "Color",
			children: [
				{
					description: "Front Background Color",
					render: ({ id }) => (
						<ColorSettings
							id={id}
							label="Front Background Color"
							path="frontBgColor"
						/>
					),
				},
				{
					description: "Back Background Color",
					render: ({ id }) => (
						<ColorSettings
							id={id}
							label="Back Background Color"
							path="backBgColor"
						/>
					),
				},
			],
		},
	],
};
