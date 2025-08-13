import { HorizontalRule } from "@mui/icons-material";
import type { CSSProperties } from "react";
import { InputSettings, SelectInputSettings } from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: HorizontalRule,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Show Text",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Show Text"
							path="showText"
							description="Add text to the divider"
						/>
					),
				},
				{
					description: "Divider Text",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Divider Text"
							path="text"
						/>
					),
				},
				{
					description: "Light Variant",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Light Variant"
							path="light"
							description="Use a lighter color for the divider"
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
		{
			name: "Layout",
			children: [
				{
					description: "Variant",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Variant"
							path="variant"
							options={[
								{ value: "fullWidth", display: "Full Width" },
								{ value: "inset", display: "Inset" },
								{ value: "middle", display: "Middle" },
							]}
						/>
					),
				},
				{
					description: "Orientation",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Orientation"
							path="orientation"
							options={[
								{ value: "horizontal", display: "Horizontal" },
								{ value: "vertical", display: "Vertical" },
							]}
						/>
					),
				},
				{
					description: "Text Alignment",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Text Alignment"
							path="textAlign"
							options={[
								{ value: "center", display: "Center" },
								{ value: "left", display: "Left" },
								{ value: "right", display: "Right" },
							]}
						/>
					),
				},
				{
					description: "Flex Item",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Flex Item"
							path="flexItem"
							description="Display as a flex item"
						/>
					),
				},
			],
		},
		buildDimensionsSection(),
	],
};
