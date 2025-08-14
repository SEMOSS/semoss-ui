import { SmartButton } from "@mui/icons-material";
import type { CSSProperties } from "react";
import { OptionsSettings, SelectInputSettings } from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_ACTION,
	icon: SmartButton,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Options",
					render: ({ id }) => (
						<OptionsSettings id={id} path="options" />
					),
				},
				{
					description: "Mandatory",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Mandatory"
							path="mandatory"
						/>
					),
				},
				{
					description: "Multiple",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Multiple"
							path="multiple"
							resetValueOnChange
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
			name: "Style",
			children: [
				{
					description: "Color",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Color"
							path="color"
							options={[
								{
									value: "primary",
									display: "primary",
								},
								{
									value: "secondary",
									display: "secondary",
								},
							]}
						/>
					),
				},
				{
					description: "Size",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Size"
							path="size"
							options={[
								{
									value: "small",
									display: "small",
								},
								{
									value: "medium",
									display: "medium",
								},
								{
									value: "large",
									display: "large",
								},
							]}
						/>
					),
				},
			],
		},
	],
};
