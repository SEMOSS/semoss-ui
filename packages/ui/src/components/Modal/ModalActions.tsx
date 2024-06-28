import {
    DialogActions as MuiModalActions,
    SxProps,
    styled,
} from "@mui/material";

const StyledModalActions = styled(MuiModalActions)(({ theme }) => ({
    padding: `0 ${theme.spacing(3)} ${theme.spacing(3)}`,
}));

export interface ModalActionsProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * If `true`, the actions do not have additional margin.
     * @default false
     */
    disableSpacing?: boolean;
}

export const ModalActions = (props: ModalActionsProps) => {
    const { sx, children } = props;
    return (
        <StyledModalActions sx={sx} {...props}>
            {children}
        </StyledModalActions>
    );
};
