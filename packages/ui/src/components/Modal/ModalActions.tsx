import { DialogActions as MuiModalActions } from "@mui/material";
import { SxProps } from "@mui/system";

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
        <MuiModalActions sx={sx} {...props}>
            {children}
        </MuiModalActions>
    );
};
