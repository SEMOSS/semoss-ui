import { Ratio } from "lucide-react";
import { BorderSettings, InputSettings } from "../../settings";
import { InputModalSettings } from "../../settings/shared/InputModalSettings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: Ratio,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Source",
					render: ({ id }) => (
						<InputModalSettings
							id={id}
							label="Source"
							placeholder="https://www.example.com"
							path="src"
						/>
					),
				},
				{
					description: "Title",
					render: ({ id }) => (
						<InputSettings id={id} label="Title" path="title" />
					),
				},
				{
					description: "Frame Interaction",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Frame Interaction"
							path="enableFrameInteractions"
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
		buildDimensionsSection(),
		buildSpacingSection(),
		{
			name: "Color",
			children: [
				{
					description: "Border",
					render: ({ id }) => (
						<BorderSettings id={id} path="style.border" />
					),
				},
			],
		},
	],
};
