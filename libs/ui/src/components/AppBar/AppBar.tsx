import {
	AppBar as MuiAppBar,
	type AppBarProps as MuiAppBarProps,
	SxProps,
} from "@mui/material";

export type AppBarProps = MuiAppBarProps;

export const AppBar = (props: AppBarProps) => {
	return <MuiAppBar {...props}>{props.children}</MuiAppBar>;
};
