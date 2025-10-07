import { ViewList } from "@mui/icons-material";
import {
	InputSettings,
	QuerySelectionSettings,
	SelectOptionsSettings,
} from "../../settings";
import { SelectInputValueSettings } from "../../settings/custom/SelectInputValueSettings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: ViewList,
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
					description: "Hint",
					render: ({ id }) => (
						<InputSettings id={id} label="Hint" path="hint" />
					),
				},
				{
					description: "Multi Select",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Enable Multi Select"
							path="multiple"
							description="This setting will enable the multi-select feature on the select input"
						/>
					),
				},
				{
					description: "Option Settings",
					render: ({ id }) => {
						return (
							<SelectOptionsSettings
								id={id}
								optionData={[
									{
										label: "Label",
										path: "optionLabel",
									},
									{
										label: "Sublabel",
										path: "optionSublabel",
									},
								]}
								label="Option Label"
								path="optionLabel"
							/>
						);
					},
				},
				{
					description: "Value",
					render: ({ id }) => (
						<SelectInputValueSettings id={id} path="value" />
					),
				},
				{
					description: "Loading",
					render: ({ id }) => (
						<QuerySelectionSettings
							id={id}
							label="Loading"
							path="loading"
							queryPath="isLoading"
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
		{
			name: "On Open",
			children: [...buildListener("onOpen")],
		},
	],
	styleMenu: [],
};
