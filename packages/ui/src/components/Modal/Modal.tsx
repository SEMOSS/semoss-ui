import { Dialog as MuiModal } from "@mui/material";
import { SxProps } from "@mui/system";
import { DialogProps as MuiModalProps } from "@mui/material";

export interface ModalProps extends MuiModalProps {
    /** custom style object */
    sx?: SxProps;
}

export const Modal = (props: ModalProps) => {
    const { sx } = props;
    return <MuiModal sx={sx} {...props} />;
};
