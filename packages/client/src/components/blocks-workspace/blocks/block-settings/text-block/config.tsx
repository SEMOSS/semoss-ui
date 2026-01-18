import { TextFields } from "@mui/icons-material";
import type { CSSProperties } from "react";
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

export const DefaultStyles: CSSProperties = {
	padding: "4px",
	whiteSpace: "pre-line",
	textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: TextFields,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Text",
					render: ({ id }) => (
						<QueryInputSettings id={id} label="Text" path="text" />
					),
				},
				{
					description: "Enable Typewriting Effect",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable Typewriting Effect"
							path="isStreaming"
							description="This setting will enable the typewriting effect on the text"
						/>
					),
				},
				{
					description: "Show Placeholder When Empty",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable Loading Placeholder"
							path="showPlaceholder"
							description='If enabled, displays "Waiting for value..." when no text value is set.'
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
