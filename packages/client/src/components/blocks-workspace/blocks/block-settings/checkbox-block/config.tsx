import { CheckBox } from "@mui/icons-material";
import { InputSettings, SelectInputSettings } from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: CheckBox,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Checked",
					render: ({ id }) => (
						<SwitchSettings id={id} label="Checked" path="value" />
					),
				},
				{
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
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
	styleMenu: [],
};
