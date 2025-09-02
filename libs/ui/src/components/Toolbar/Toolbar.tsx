import {
	Toolbar as MuiToolbar,
	type ToolbarProps as MuiToolbarProps,
	SxProps,
} from "@mui/material";

export type ToolbarProps = MuiToolbarProps;

export const Toolbar = (props: ToolbarProps) => {
	return <MuiToolbar {...props}>{props.children}</MuiToolbar>;
};
