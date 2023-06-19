import { ReactNode } from "react";
import MuiAlertTitle from "@mui/material/AlertTitle";
import { SxProps } from "@mui/system";
import { AlertTitleProps as MuiAlertTitleProps } from "@mui/material";

export interface AlertTitleProps extends MuiAlertTitleProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const AlertTitle = (props: AlertTitleProps) => {
    const { children, sx } = props;
    return (
        <MuiAlertTitle sx={sx} {...props}>
            {children}
        </MuiAlertTitle>
    );
};
