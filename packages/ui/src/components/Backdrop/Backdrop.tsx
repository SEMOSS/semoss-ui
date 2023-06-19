import { ReactNode } from "react";
import MuiBackdrop from "@mui/material/Backdrop";
import { SxProps } from "@mui/system";
import { BackdropProps as MuiBackdropProps } from "@mui/material";

export interface BackdropProps extends MuiBackdropProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const Backdrop = (props: BackdropProps) => {
    const { children, sx } = props;
    return (
        <MuiBackdrop sx={sx} {...props}>
            {children}
        </MuiBackdrop>
    );
};
