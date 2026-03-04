import type { CSSProperties } from "react";
import { lightTheme } from "@semoss/ui";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_THEME } from "../block-defaults.constants";
import { ThemeBlock, type ThemeBlockDef } from "./ThemeBlock";

export const DefaultStyles: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	padding: "24px",
	gap: "8px",
	fontFamily: "roboto",
};

// export the config for the block
export const config: BlockConfig<ThemeBlockDef> = {
	widget: "theme",
	type: BLOCK_TYPE_THEME,
	data: {
		theme: lightTheme,
	},
	listeners: {},
	slots: {
		children: [],
	},
	render: ThemeBlock,
};
