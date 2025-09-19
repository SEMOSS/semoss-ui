import { FileCopyOutlined } from "@mui/icons-material";
import type { CSSProperties } from "react";
import {
	BorderSettings,
	InputSettings,
	QuerySelectionSettings,
	SizeSettings,
} from "../../settings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildColorSection,
	buildLayoutSection,
	buildListener,
	buildTypographySection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	padding: "24px",
	gap: "8px",
	fontFamily: "roboto",
};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: FileCopyOutlined,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Route",
					render: ({ id }) => (
						<InputSettings id={id} label="Route" path="route" />
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
			name: "on Page Load",
			children: [...buildListener("onPageLoad")],
		},
	],
	styleMenu: [
		buildLayoutSection(),
		// root pages don't get margin for spacing
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
		buildColorSection(),
		{
			name: "Border",
			children: [
				{
					description: "Border",
					render: ({ id }) => (
						<BorderSettings id={id} path="style.border" />
					),
				},
			],
		},
		buildTypographySection(),
	],
};
