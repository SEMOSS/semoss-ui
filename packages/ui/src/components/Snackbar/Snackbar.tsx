import MuiSnackbar from "@mui/material/Snackbar";
import { SxProps } from "@mui/system";
import { SnackbarProps as MuiSnackbarProps } from "@mui/material";

export interface SnackbarProps extends MuiSnackbarProps {
    /** custom style object */
    sx?: SxProps;
}

export const Snackbar = (props: SnackbarProps) => {
    const { sx } = props;
    return <MuiSnackbar sx={sx} {...props} />;
};
