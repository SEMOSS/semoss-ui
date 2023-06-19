import { ReactNode } from "react";
import MuiFormLabel from "@mui/material/FormLabel";
import { SxProps } from "@mui/system";
import { FormLabelProps as MuiFormLabelProps } from "@mui/material";

export interface FormLabelProps extends MuiFormLabelProps {
    /** custom style object */
    sx?: SxProps;
}

export const FormLabel = (props: FormLabelProps) => {
    const { sx } = props;
    return <MuiFormLabel sx={sx} {...props} />;
};
