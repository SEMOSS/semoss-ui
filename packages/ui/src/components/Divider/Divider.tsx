import MuiDivider from "@mui/material/Divider";
import { SxProps } from "@mui/system";
import { DividerProps as MuiDividerProps } from "@mui/material";

export interface DividerProps extends MuiDividerProps {
    /** custom style object */
    sx?: SxProps;
}

export const Divider = (props: DividerProps) => {
    const { sx } = props;
    return <MuiDivider sx={sx} {...props} />;
};
