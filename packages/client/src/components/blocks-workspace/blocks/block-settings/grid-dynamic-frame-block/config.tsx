import { TableChart } from "@mui/icons-material";
import { DynamicGridMenu } from "../../settings";
import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { buildDimensionsSection } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DATA,
	icon: TableChart,
	contentMenu: [
		{
			name: "Data",
			children: [
				{
					description: "Layout",
					render: ({ id }) => <DynamicGridMenu id={id} />,
				},
			],
		},
	],
	styleMenu: [buildDimensionsSection()],
};
