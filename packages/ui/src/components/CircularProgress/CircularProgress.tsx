import MuiCircularProgress from "@mui/material/CircularProgress";
import { SxProps } from "@mui/system";
import { CircularProgressProps as MuiCircularProgressProps } from "@mui/material";

export interface CircularProgressProps extends MuiCircularProgressProps {
    /** custom style object */
    sx?: SxProps;
}

export const CircularProgress = (props: CircularProgressProps) => {
    const { sx } = props;
    return <MuiCircularProgress sx={sx} {...props} />;
};
