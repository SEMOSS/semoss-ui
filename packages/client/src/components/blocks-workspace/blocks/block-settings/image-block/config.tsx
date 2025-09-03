import {
	AspectRatio,
	FitScreen,
	ImageAspectRatio,
	PanoramaOutlined,
} from "@mui/icons-material";
import { ButtonGroupSettings, SelectInputSettings } from "../../settings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";
import GeneralSettings from "./GeneralSettings";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: PanoramaOutlined,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "",
					render: ({ id }) => <GeneralSettings id={id} />,
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
			name: "Layout",
			children: [
				{
					description: "Ratio",
					render: ({ id }) => (
						<ButtonGroupSettings
							id={id}
							path="style.backgroundSize"
							label="Ratio"
							options={[
								{
									value: "100% 100%",
									icon: FitScreen,
									title: "fit",
									isDefault: false,
								},
								{
									value: "cover",
									icon: AspectRatio,
									title: "cover",
									isDefault: false,
								},
								{
									value: "contain",
									icon: ImageAspectRatio,
									title: "contain",
									isDefault: true,
								},
							]}
						/>
					),
				},
				{
					description: "Position",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							path="style.backgroundPosition"
							label="Position"
							allowUnset
							allowCustomInput
							options={[
								{
									value: "top left",
									display: "Top left",
								},
								{
									value: "top center",
									display: "Top Center",
								},
								{
									value: "top right",
									display: "Top Right",
								},
								{
									value: "center left",
									display: "Center Left",
								},
								{
									value: "center center",
									display: "Center",
								},
								{
									value: "center right",
									display: "Center Right",
								},
								{
									value: "bottom left",
									display: "Bottom Left",
								},
								{
									value: "bottom center",
									display: "Bottom Center",
								},
								{
									value: "bottom right",
									display: "Bottom Right",
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
