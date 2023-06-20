import { ReactNode } from "react";
import { DialogActions as MuiModalActions } from "@mui/material";
import { SxProps } from "@mui/system";
import { DialogActionsProps as MuiModalActionsProps } from "@mui/material";

export interface ModalActionsProps extends MuiModalActionsProps {
    /** custom style object */
    sx?: SxProps;

    /** children to be rendered */
    children: ReactNode;
}

export const ModalActions = (props: ModalActionsProps) => {
    const { sx, children } = props;
    return (
        <MuiModalActions sx={sx} {...props}>
            {children}
        </MuiModalActions>
    );
};
