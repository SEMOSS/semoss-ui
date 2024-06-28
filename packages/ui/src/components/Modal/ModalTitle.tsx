import { DialogTitle as MuiModalTitle, SxProps, styled } from "@mui/material";

const StyledModalTitle = styled(MuiModalTitle)(({ theme }) => ({
    padding: theme.spacing(3),
}));

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
    const { sx, children, ...rest } = props;

    return (
        <StyledModalTitle sx={sx} {...rest}>
            {children}
        </StyledModalTitle>
    );
};
