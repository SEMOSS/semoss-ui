import { ArrowDown, ArrowRight, Network } from "lucide-react";
import {
	ButtonGroupSettings,
	QueryInputSettings,
	SizeSettings,
} from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildColorSection,
	buildListener,
	buildShowField,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Network,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Design Mode",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Design Mode"
							path="designMode"
							description="Enable this in order to edit sidebar content without interference from app interactions."
						/>
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [
				...buildShowField(),
				{
					description: "Open State",
					render: ({ id }) => (
						<QueryInputSettings
							id={id}
							label="Open State"
							path="open"
						/>
					),
				},
			],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
		{
			name: "Post Process",
			children: [...buildListener("postProcess")],
		},
	],
	styleMenu: [
		{
			name: "Layout",
			children: [
				{
					description: "Direction",
					render: ({ id }) => (
						<ButtonGroupSettings
							id={id}
							path="anchor"
							label="Direction"
							options={[
								{
									value: "top",
									icon: ArrowDown,
									title: "Top",
									isDefault: false,
								},
								{
									value: "left",
									icon: ArrowRight,
									title: "Left",
									isDefault: true,
								},
							]}
						/>
					),
				},
			],
		},
		{
			name: "Dimensions",
			children: [
				{
					description: "Width",
					render: ({ id }) => (
						<SizeSettings
							id={id}
							label="Width"
							path="style.width"
						/>
					),
				},
				{
					description: "Height",
					render: ({ id }) => (
						<SizeSettings
							id={id}
							label="Height"
							path="style.height"
						/>
					),
				},
			],
		},
		buildColorSection(),
		{
			name: "Spacing",
			children: [
				{
					description: "Padding",
					render: ({ id }) => (
						<SizeSettings
							id={id}
							label="Padding"
							path="style.padding"
						/>
					),
				},
			],
		},
		buildBorderSection(),
	],
};
