import {
	createTheme,
	ThemeProvider as MuiThemeProvider,
	type ThemeOptions,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";
import { Slot } from "../../blocks";

export interface ThemeBlockDef extends BlockDef<"theme"> {
	widget: "theme";
	data: {
		theme: {};
	};
	slots: {
		children: true;
	};
}

export const ThemeBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots } = useBlock<ThemeBlockDef>(id);

	const t = useMemo(() => {
		return createTheme({ ...(data.theme as ThemeOptions) });
	}, [data.theme]);

	return (
		<MuiThemeProvider theme={t}>
			<div {...attrs}>
				<Slot slot={slots.children}></Slot>
			</div>
		</MuiThemeProvider>
	);
});
