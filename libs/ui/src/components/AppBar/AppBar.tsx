import {
    AppBar as MuiAppBar,
    SxProps,
    AppBarProps as MuiAppBarProps,
} from "@mui/material";

export type AppBarProps = MuiAppBarProps;

export const AppBar = (props: AppBarProps) => {
    return <MuiAppBar {...props}>{props.children}</MuiAppBar>;
};
