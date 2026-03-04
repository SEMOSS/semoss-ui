import { HighlightAlt } from "@mui/icons-material";
import { QueryNameDropdownSettings } from "../../settings/custom/QueryNameDropdownSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: HighlightAlt,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Sheet",
					render: ({ id }) => (
						<QueryNameDropdownSettings
							id={id}
							label="Query"
							path="queryId"
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
	],
	styleMenu: [],
};
