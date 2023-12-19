import {
    LinearProgress,
    TextField as MuiTextField,
    TextFieldProps as MuiTextFieldProps,
    SxProps,
} from "@mui/material";

export type TextFieldProps = MuiTextFieldProps & {
    /** custom style object */
    sx?: SxProps;

    /**
     * Set loading state
     */
    loading?: boolean;
};

export const TextField = (props: TextFieldProps) => {
    let muiTextFieldProps = { ...props };
    if (muiTextFieldProps?.loading) {
        delete muiTextFieldProps.loading;
    }

    return (
        <MuiTextField
            {...muiTextFieldProps}
            helperText={
                props?.loading ? (
                    <LinearProgress color="primary" />
                ) : (
                    props?.helperText
                )
            }
        />
    );
};
