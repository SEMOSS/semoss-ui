import { MousePointerClick } from "lucide-react";
import { QueryNameDropdownSettings } from "../../settings/custom/query-name-dropdown-settings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: MousePointerClick,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Notebook",
					render: ({ id }) => (
						<QueryNameDropdownSettings
							id={id}
							label="Notebook"
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
