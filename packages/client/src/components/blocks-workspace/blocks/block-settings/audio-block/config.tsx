import HeadsetIcon from "@mui/icons-material/Headset";
import type { CSSProperties } from "react";
import { InputSettings, QueryInputSettings } from "../../settings/";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_ACTION,
	icon: HeadsetIcon,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "Audio URL",
					render: ({ id }) => (
						<QueryInputSettings
							id={id}
							label="Audio URL"
							path="source"
						/>
					),
				},
				{
					description: "Autoplay",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable Autoplay"
							path="autoplay"
							description="This setting will enable autoplay of the audio"
						/>
					),
				},
				{
					description: "Controls",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable controls"
							path="controls"
							description="This setting will enable controls like pause, play, volume-control on the audio player"
						/>
					),
				},
				{
					description: "Loop",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable loop"
							path="loop"
							description="This setting will play the audio in a loop"
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
	styleMenu: [],
};
