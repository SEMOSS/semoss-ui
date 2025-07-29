import { ReactNode } from "react";
import { AlertTitle as MuiAlertTitle, SxProps } from "@mui/material";

export interface AlertTitleProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({
    children,
    sx,
    ...otherProps
}) => {
    return (
        <MuiAlertTitle sx={sx} {...otherProps}>
            {children}
        </MuiAlertTitle>
    );
};
