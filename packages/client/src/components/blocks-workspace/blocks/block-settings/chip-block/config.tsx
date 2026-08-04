import { Tag } from "lucide-react";
import {
	ColorSettings,
	InputSettings,
	SelectInputSettings,
} from "../../settings";
import { ChipSettings } from "../../settings/custom/ChipSettings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: Tag,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Chip Type",
					render: ({ id }) => (
						<ChipSettings
							id={id}
							label="Type"
							path="type"
							options={[
								{
									value: "Chip",
									display: "Chip",
								},
								{
									value: "Icon",
									display: "Icon Chip",
								},
								{
									value: "Avatar",
									display: "Avatar Chip",
								},
								{
									value: "Link",
									display: "Link Chip",
								},
							]}
						/>
					),
				},
				{
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "clickable",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label={"Clickable"}
							path={"clickable"}
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
			name: "General",
			children: [
				{
					description: "Variant",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Variant"
							path="variant"
							options={[
								{
									value: "null",
									display: "filled",
								},
								{
									value: "outlined",
									display: "outlined",
								},
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
						<ColorSettings
							id={id}
							label="Color"
							path="style.color"
						/>
					),
				},
			],
		},
		{
			name: "Dimensions",
			children: [
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
									display: "Small",
								},
								{
									value: "medium",
									display: "Medium",
								},
							]}
						/>
					),
				},
			],
		},
	],
};
