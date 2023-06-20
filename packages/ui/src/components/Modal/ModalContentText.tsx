import { ReactNode } from "react";
import { DialogContentText as MuiModalContentText } from "@mui/material";
import { SxProps } from "@mui/system";
import { DialogContentTextProps as MuiModalContentTextProps } from "@mui/material";

export interface ModalContentTextProps extends MuiModalContentTextProps {
    /** children to be rendered */
    children: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const ModalContentText = (props: ModalContentTextProps) => {
    const { children, sx } = props;
    return (
        <MuiModalContentText sx={sx} {...props}>
            {children}
        </MuiModalContentText>
    );
};
