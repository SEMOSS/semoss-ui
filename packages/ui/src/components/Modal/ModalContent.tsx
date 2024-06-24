import {
    DialogContent as MuiModalContent,
    SxProps,
    styled,
} from "@mui/material";

const StyledModalContent = styled(MuiModalContent)(({ theme }) => ({
    padding: `0 ${theme.spacing(2)} ${theme.spacing(2)}`,
}));

export interface ModalContentProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * Display the top and bottom dividers.
     * @default false
     */
    dividers?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ModalContent = (props: ModalContentProps) => {
    const { children, sx } = props;
    return (
        <StyledModalContent sx={sx} {...props}>
            {children}
        </StyledModalContent>
    );
};
