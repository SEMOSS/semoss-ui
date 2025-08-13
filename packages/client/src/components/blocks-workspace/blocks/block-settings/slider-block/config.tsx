import { BlurLinear } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Menu, Select } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import {
	ColorSettings,
	InputSettings,
	OptionsSettings,
	SizeSettings,
} from "../../settings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: BlurLinear,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Type",
					render: observer(({ id }) => {
						const { data, setData } = useBlockSettings(id);

						const options = [
							{
								value: "continuous",
								display: "Continuous",
							},
							{
								value: "discrete",
								display: "Discrete",
							},
						];
						const onChange = (value: string) => {
							setData("type", value);
						};
						return (
							<Select
								label="Type"
								fullWidth
								size="small"
								value={data.type}
								onChange={(e) => {
									onChange(e.target.value);
								}}
							>
								{Array.from(options, (option, i) => {
									return (
										<Menu.Item key={i} value={option.value}>
											{option.display}
										</Menu.Item>
									);
								})}
							</Select>
						);
					}),
				},
				{
					description: "Marks",
					render: observer(({ id }) => {
						const { data } = useBlockSettings(id);
						return (
							<>
								{data.type === "discrete" && (
									<OptionsSettings
										id={id}
										path="marks"
										label="Marks"
										tooltip="Add marks to the slider"
									/>
								)}
							</>
						);
					}),
				},
				{
					description: "Steps",
					render: observer(({ id }) => {
						const { data } = useBlockSettings(id);

						return (
							<>
								{data.type === "discrete" && (
									<InputSettings
										id={id}
										label="Steps"
										path="steps"
										type="number"
										description="Define the number of steps in the slider"
									/>
								)}
							</>
						);
					}),
				},
				{
					description: "Minimum Value",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Minimum Value"
							path="min"
							type="number"
						/>
					),
				},
				{
					description: "Maximum Value",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Maximum Value"
							path="max"
							type="number"
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
		{
			name: "On Change",
			children: [...buildListener("onChange")],
		},
	],
	styleMenu: [
		{
			name: "Color",
			children: [
				{
					description: "Slider Color",
					render: ({ id }) => (
						<ColorSettings
							id={id}
							label="Slider Color"
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
						<SizeSettings id={id} label="Size" path="size" />
					),
				},
			],
		},
	],
};
