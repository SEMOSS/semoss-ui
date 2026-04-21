import { List } from "lucide-react";
import { QueryInputSettings } from "../../settings";
import { ShowLoadingSettings } from "../../settings/shared/ShowLoadingSettings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {
	buildListener,
	buildShowField,
	buildTextAlignSection,
	buildTypographySection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: List,
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
			name: "Loading",
			children: [
				{
					description: "Show Loading",
					render: ({ id }) => <ShowLoadingSettings id={id} />,
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
	styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
