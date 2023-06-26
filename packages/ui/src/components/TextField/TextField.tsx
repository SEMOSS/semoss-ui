import MuiTextField from "@mui/material/TextField";
import { SxProps } from "@mui/system";

import { TextFieldProps as MuiTextFieldProps } from "@mui/material";

export type TextFieldProps = MuiTextFieldProps & {
    variant;
    /** custom style object */
    sx?: SxProps;
};

export const TextField = (props: TextFieldProps) => {
    const { sx } = props;
    return <MuiTextField sx={sx} {...props} />;
};
