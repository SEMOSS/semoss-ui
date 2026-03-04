import { KeyboardVoice } from "@mui/icons-material";
import { CSSProperties } from "react";
import { QuerySelectionSettings, SelectInputSettings } from "../../settings";
import { InputAudioSettings } from "../../settings/shared/InputAudioSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: KeyboardVoice,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Mode",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Mode"
							path="mode"
							options={[
								{
									value: "transcribe",
									display: "Speech to Text",
								},
								{ value: "record", display: "Audio Recording" },
							]}
						/>
					),
				},
				{
					description: "Value",
					render: ({ id }) => (
						<InputAudioSettings
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
			name: "On Complete",
			children: [...buildListener("onComplete")],
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
