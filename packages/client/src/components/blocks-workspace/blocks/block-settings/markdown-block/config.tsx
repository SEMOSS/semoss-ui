import { FormatListBulleted } from "@mui/icons-material";
import { QueryInputSettings } from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildColorSection,
	buildDimensionsSection,
	buildListener,
	buildShowField,
	buildSpacingSection,
	buildTextAlignSection,
	buildTypographySection,
    buildLoadStateSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: FormatListBulleted,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Markdown",
					render: ({ id }) => (
						<QueryInputSettings
							id={id}
							label="Markdown"
							path="markdown"
						/>
					),
				},
				{
					description: "Enable Typewriting Effect",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable Typewriting Effect"
							path="isStreaming"
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
            name: 'Load State',
            children: [...buildLoadStateSection()],
        },
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
	],
	styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
