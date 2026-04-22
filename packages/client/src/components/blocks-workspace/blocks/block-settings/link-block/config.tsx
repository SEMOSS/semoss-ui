import { Link2 } from "lucide-react";
import { InputSettings } from "../../settings";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import {
	buildListener,
	buildShowField,
	buildTextAlignSection,
	buildTypographySection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_ACTION,
	icon: Link2,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Text",
					render: ({ id }) => (
						<InputSettings id={id} label="Text" path="text" />
					),
				},
				{
					description: "Destination",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Destination"
							path="href"
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
	styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
