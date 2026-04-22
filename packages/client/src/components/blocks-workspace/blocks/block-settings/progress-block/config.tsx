import { SlidersHorizontal } from "lucide-react";
import {
	InputSettings,
	SelectInputSettings,
	SizeSettings,
} from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_CHART,
	icon: SlidersHorizontal,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Type",
					render: ({ id }) => {
						return (
							<SelectInputSettings
								id={id}
								path="type"
								label="Type"
								resizeOnSet
								options={[
									{
										value: "linear",
										display: "linear",
									},
									{
										value: "circular",
										display: "circular",
									},
								]}
							/>
						);
					},
				},
				{
					description: "Include Label",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Include Label"
							path="includeLabel"
						/>
					),
				},
				{
					description: "Value",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Value"
							path="value"
							type="value"
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
			name: "Dimensions",
			children: [
				{
					description: "Size",
					render: ({ id }) => (
						<SizeSettings id={id} label="Size" path="size" />
					),
				},
			],
		},
	],
};
