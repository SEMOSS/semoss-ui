import React from "react";
import MuiSnackbar from "@mui/material/Snackbar";
import { SxProps } from "@mui/system";
import { SnackbarProps as MuiSnackbarProps } from "@mui/material";

interface anchorOriginProps {
    horizontal: "center" | "left" | "right";
    vertical: "bottom" | "top";
}
export interface SnackbarProps extends MuiSnackbarProps {
    /** custom style object */
    open: boolean;
    children: React.ReactElement<any, any>;
    anchorOrigin?: anchorOriginProps;
    autoHideDuration?: number;
    onClose?: () => void;
    sx?: SxProps;
}

export const Snackbar = (props: SnackbarProps) => {
    const { sx } = props;
    return <MuiSnackbar sx={sx} {...props} />;
};
