import { Tab } from "@mui/icons-material";
import {
	InputSettings,
	SelectInputSettings,
	SwitchSettings,
	TabBlockArraySettings,
} from "../../settings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Tab,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Active Tab",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Active Tab"
							path="activeTab"
							type="number"
							inputProps={{ min: 0 }}
						/>
					),
				},
				{
					description: "Tab Labels",
					render: ({ id }) => (
						<TabBlockArraySettings
							id={id}
							label="Tab Labels"
							path="tabLabels"
							description="Add, remove and edit tab labels, Each label will create a seperate tab"
							minItems={1}
							maxItems={20}
						/>
					),
				},
				{
					description: "Tab Orientation",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Tab Orientation"
							path="tabOrientation"
							options={[
								{ value: "horizontal", display: "Horizontal" },
								{ value: "vertical", display: "Vertical" },
							]}
						/>
					),
				},
				{
					description: "Tab Variant",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Tab Variant"
							path="variant"
							options={[
								{ value: "standard", display: "Standard" },
								{ value: "fullWidth", display: "Full Width" },
								{ value: "scrollable", display: "Scrollable" },
							]}
						/>
					),
				},
				{
					description: "Show Tab Indicator",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Show Tab Indicator"
							path="showTabIndicator"
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
			name: "Colors",
			children: [
				{
					description: "Text Color",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Text Color"
							path="textColor"
							options={[
								{ value: "primary", display: "Primary" },
								{ value: "secondary", display: "Secondary" },
								{ value: "warning", display: "Warning" },
								{ value: "error", display: "Error" },
								{ value: "info", display: "Info" },
								{ value: "inherit", display: "Inherit" },
							]}
						/>
					),
				},
				{
					description: "Indicator Color",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							label="Indicator Color"
							path="indicatorColor"
							options={[
								{ value: "primary", display: "Primary" },
								{ value: "secondary", display: "Secondary" },
								{ value: "warning", display: "Warning" },
								{ value: "error", display: "Error" },
								{ value: "info", display: "Info" },
								{ value: "inherit", display: "Inherit" },
							]}
						/>
					),
				},
			],
		},
	],
};
