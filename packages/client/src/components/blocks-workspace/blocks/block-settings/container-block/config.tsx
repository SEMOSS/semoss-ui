import { HighlightAlt } from "@mui/icons-material";
import { ContainerLayoutSettings } from "../../settings";
import { SelectInputSettings } from "../../settings/shared/SelectInputSettings";
import { ShowLoadingSettings } from "../../settings/shared/ShowLoadingSettings";
import { SizeSettings } from "../../settings/shared/SizeSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildColorSection,
	buildDimensionsSection,
	buildListener,
	buildShadowSection,
	buildShowField,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: HighlightAlt,
	contentMenu: [
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
		{
			name: "Loading",
			children: [
				{
					description: "Show Loading",
					render: ({ id }) => <ShowLoadingSettings id={id} />,
				},
			],
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
					description: "Layout",
					render: ({ id }) => <ContainerLayoutSettings id={id} />,
				},
			],
		},
		{
			name: "Position",
			children: [
				{
					description: "Position",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							path="style.position"
							label="Position"
							options={[
								{ value: "static", display: "Static" },
								{ value: "relative", display: "Relative" },
								{ value: "absolute", display: "Absolute" },
								{ value: "fixed", display: "Fixed" },
								{ value: "sticky", display: "Sticky" },
							]}
						/>
					),
				},
				{
					description: "Top",
					render: ({ id }) => (
						<SizeSettings id={id} label="Top" path="style.top" />
					),
				},
				{
					description: "Z-Index",
					render: ({ id }) => (
						<SizeSettings
							id={id}
							label="Z-Index"
							path="style.zIndex"
						/>
					),
				},
				{
					description: "Overflow",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							path="style.overflow"
							label="Overflow"
							options={[
								{ value: "visible", display: "Visible" },
								{ value: "hidden", display: "Hidden" },
								{ value: "scroll", display: "Scroll" },
								{
									value: "auto",
									display: "Auto",
									isDefault: true,
								},
							]}
						/>
					),
				},
			],
		},
		buildSpacingSection(),
		buildDimensionsSection(),
		buildColorSection(),
		buildBorderSection(),
		buildShadowSection(),
	],
};
