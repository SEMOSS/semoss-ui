import MuiInputLabel from "@mui/material/InputLabel";
import { SxProps } from "@mui/system";

import { InputLabelProps as MuiInputLabelProps } from "@mui/material";

export interface InputLabelProps extends MuiInputLabelProps {
    /** custom style object */
    sx?: SxProps;
}

export const InputLabel = (props: InputLabelProps) => {
    const { sx } = props;
    return <MuiInputLabel sx={sx} {...props} />;
};
