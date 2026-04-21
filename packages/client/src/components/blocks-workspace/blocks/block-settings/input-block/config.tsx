import { Shapes } from "lucide-react";
import type { CSSProperties } from "react";
import { InputSettings, QuerySelectionSettings } from "../../settings";
import { InputModalSettings } from "../../settings/shared/InputModalSettings";
import { SelectInputSettings } from "../../settings/shared/SelectInputSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {
	width: "100%",
	padding: "4px",
};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: Shapes,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Input Type",
					render: ({ id }) => {
						return (
							<SelectInputSettings
								id={id}
								path="type"
								label="Type"
								options={[
									{
										value: "text",
										display: "Text",
									},
									{
										value: "number",
										display: "Number",
									},
									{
										value: "date",
										display: "Date",
									},
								]}
							/>
						);
					},
				},
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
					description: "Value",
					render: ({ id }) => (
						<InputModalSettings
							id={id}
							label="Value"
							path="value"
						/>
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
				{
					description: "Disabled",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Disabled"
							path="disabled"
						/>
					),
				},
				{
					description: "Required",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Required"
							path="required"
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
			name: "Miscellaneous",
			children: [
				{
					description: "Rows",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Rows"
							path="rows"
							type="number"
							description="This will determine how many rows are displayed on text input"
						/>
					),
				},
			],
		},
	],
};
