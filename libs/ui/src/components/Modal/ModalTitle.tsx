import { DialogTitle as MuiModalTitle, SxProps } from "@mui/material";

export interface ModalTitleProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ModalTitle = (props: ModalTitleProps) => {
    const { sx, children } = props;
    return (
        <MuiModalTitle sx={sx} {...props}>
            {children}
        </MuiModalTitle>
    );
};
