import MuiLinearProgress from "@mui/material/LinearProgress";
import { SxProps } from "@mui/system";
import { LinearProgressProps as MuiLinearProgressProps } from "@mui/material";

export interface LinearProgressProps extends MuiLinearProgressProps {
    /** custom style object */
    sx?: SxProps;
}

export const LinearProgress = (props: LinearProgressProps) => {
    const { sx } = props;
    return <MuiLinearProgress sx={sx} {...props} />;
};
