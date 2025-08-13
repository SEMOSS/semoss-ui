import { ToggleOn } from "@mui/icons-material";
import type { CSSProperties } from "react";
import {
	InputSettings,
	QueryInputSettings,
	SelectInputSettings,
} from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {
	width: "fit-content",
};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: ToggleOn,
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
					description: "Helper Text",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Helper Text"
							path="helperText"
						/>
					),
				},
				{
					description: "Value",
					render: ({ id }) => (
						<QueryInputSettings
							id={id}
							label="Value"
							path="value"
						/>
					),
				},
				{
					description: "Required",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Required"
							path="required"
							description="Mark field as required"
						/>
					),
				},
				{
					description: "Disabled",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Disabled"
							path="disabled"
							description="Disable switch interaction"
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
		{
			name: "On Change",
			children: [...buildListener("onChange")],
		},
	],
	styleMenu: [
		{
			name: "Layout",
			children: [
				{
					description: "Label Placement",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Label Placement"
							path="labelPlacement"
							options={[
								{ value: "end", display: "Right" },
								{ value: "start", display: "Left" },
								{ value: "top", display: "Top" },
								{ value: "bottom", display: "Bottom" },
							]}
						/>
					),
				},
			],
		},
		{
			name: "Color",
			children: [
				{
					description: "Color",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Color"
							path="color"
							options={[
								{ value: "primary", display: "Primary" },
								{ value: "secondary", display: "Secondary" },
								{ value: "default", display: "Default" },
								{ value: "error", display: "Error" },
								{ value: "info", display: "Info" },
								{ value: "success", display: "Success" },
								{ value: "warning", display: "Warning" },
							]}
						/>
					),
				},
			],
		},
		{
			name: "Size",
			children: [
				{
					description: "Size",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Size"
							path="size"
							options={[
								{ value: "small", display: "Small" },
								{ value: "medium", display: "Medium" },
							]}
						/>
					),
				},
			],
		},
		buildDimensionsSection(),
	],
};
