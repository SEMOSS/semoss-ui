import { SmartButton } from "@mui/icons-material";
import type { CSSProperties } from "react";
import {
	InputSettings,
	QuerySelectionSettings,
	SelectInputSettings,
} from "../../settings";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
} from "../block-defaults.shared";
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
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
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
					description: "Type",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Type"
							path="type"
							options={[
								{
									value: "submit",
									display: "Submit",
								},
								{
									value: "button",
									display: "Button",
								},
								{
									value: "reset",
									display: "Reset",
								},
							]}
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
			name: "On Click",
			children: [...buildListener("onClick")],
		},
	],
	styleMenu: [
		{
			name: "Style",
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
									value: "contained",
									display: "contained",
								},
								{
									value: "outlined",
									display: "outlined",
								},
								{
									value: "text",
									display: "text",
								},
							]}
							resizeOnSet
						/>
					),
				},
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
								{
									value: "success",
									display: "success",
								},
								{
									value: "warning",
									display: "warning",
								},
								{
									value: "error",
									display: "error",
								},
							]}
						/>
					),
				},
			],
		},
		buildDimensionsSection(),
	],
};
