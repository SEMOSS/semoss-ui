import { DialogTitle as MuiModalTitle, SxProps, styled } from "@mui/material";
import { IconButton } from "../../index";
import { Close } from "@mui/icons-material";

const StyledModalTitle = styled(MuiModalTitle, {
    shouldForwardProp: (prop) => prop !== "isCloseable",
})<{ isCloseable?: boolean }>(({ theme, isCloseable }) => ({
    padding: theme.spacing(2),

    ...(isCloseable && {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    }),
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

    /**
     * Provides the user with an option to to close the modal via a close icon
     */
    onClose?: () => void;
}

export const ModalTitle = (props: ModalTitleProps) => {
    const { sx, children, onClose, ...rest } = props;

    if (!!onClose) {
        return (
            <StyledModalTitle sx={sx} {...rest} isCloseable={true}>
                <div>{children}</div>

                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </StyledModalTitle>
        );
    } else {
        return (
            <StyledModalTitle sx={sx} {...rest}>
                {children}
            </StyledModalTitle>
        );
    }
};
