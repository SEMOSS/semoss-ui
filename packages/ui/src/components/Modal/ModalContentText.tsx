import { DialogContentText as MuiModalContentText } from "@mui/material";
import { SxProps } from "@mui/system";

export interface ModalContentTextProps {
    /** children to be rendered */
    children: React.ReactNode;

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
