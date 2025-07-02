import {
    Toolbar as MuiToolbar,
    SxProps,
    ToolbarProps as MuiToolbarProps,
} from "@mui/material";

export type ToolbarProps = MuiToolbarProps;

export const Toolbar = (props: ToolbarProps) => {
    return <MuiToolbar {...props}>{props.children}</MuiToolbar>;
};
