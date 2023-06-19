import { ReactNode } from "react";
import MuiAlert from "@mui/material/Alert";
import { SxProps } from "@mui/system";
import { AlertProps as MuiAlertProps } from "@mui/material";

export interface AlertProps extends MuiAlertProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const Alert = (props: AlertProps) => {
    const { children, sx } = props;
    return (
        <MuiAlert sx={sx} {...props}>
            {children}
        </MuiAlert>
    );
};
