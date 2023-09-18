import {
    TextField as MuiTextField,
    TextFieldProps as MuiTextFieldProps,
    SxProps,
} from "@mui/material";

export type TextFieldProps = MuiTextFieldProps & {
    /** custom style object */
    sx?: SxProps;
};

export const TextField = (props: TextFieldProps) => {
    const { sx } = props;
    return <MuiTextField sx={sx} {...props} />;
};
