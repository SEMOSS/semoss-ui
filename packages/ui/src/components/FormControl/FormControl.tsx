import { ReactNode } from "react";
import MuiFormControl from "@mui/material/FormControl";
import { SxProps } from "@mui/system";
import { FormControlProps as MuiFormControlProps } from "@mui/material";

export interface FormControlProps extends MuiFormControlProps {
    /** custom style object */
    sx?: SxProps;
}

export const FormControl = (props: FormControlProps) => {
    const { sx } = props;
    return <MuiFormControl sx={sx} {...props} />;
};
