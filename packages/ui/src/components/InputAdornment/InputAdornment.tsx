import MuiInputAdornment from "@mui/material/InputAdornment";
import { SxProps } from "@mui/system";

import { InputAdornmentProps as MuiInputAdornmentProps } from "@mui/material";

export interface InputAdornmentProps extends MuiInputAdornmentProps {
    /** custom style object */
    sx?: SxProps;
}

export const InputAdornment = (props: InputAdornmentProps) => {
    const { sx } = props;
    return <MuiInputAdornment sx={sx} {...props} />;
};
