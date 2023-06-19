import { ReactNode } from "react";
import MuiFormControlLabel from "@mui/material/FormControlLabel";
import { SxProps } from "@mui/system";
import { FormControlLabelProps as MuiFormControlLabelProps } from "@mui/material";

export interface FormControlLabelProps extends MuiFormControlLabelProps {
    /** custom style object */
    sx?: SxProps;
}

export const FormControlLabel = (props: FormControlLabelProps) => {
    const { sx } = props;
    return <MuiFormControlLabel sx={sx} {...props} />;
};
