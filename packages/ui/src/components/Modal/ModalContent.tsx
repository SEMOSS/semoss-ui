import { ReactNode } from "react";
import { DialogContent as MuiModalContent } from "@mui/material";
import { SxProps } from "@mui/system";
import { DialogContentProps as MuiModalContentProps } from "@mui/material";

export interface ModalContentProps extends MuiModalContentProps {
    /** children to be rendered */
    children: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const ModalContent = (props: ModalContentProps) => {
    const { children, sx } = props;
    return (
        <MuiModalContent sx={sx} {...props}>
            {children}
        </MuiModalContent>
    );
};
