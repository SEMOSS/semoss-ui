import { Star } from "@mui/icons-material";
import { InputSettings, SelectInputSettings } from "../../settings";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_ACTION,
	icon: Star,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Type",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Type"
							path="type"
							options={[
								{
									value: "heart",
									display: "Heart",
								},
								{
									value: "star",
									display: "Star",
								},
							]}
						/>
					),
				},
				{
					description: "Max Rating",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Max Rating"
							path="max"
							type="number"
							valueAsObject={false}
							min={1}
							limit={10}
							description="Set the maximum rating (1-10)"
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
