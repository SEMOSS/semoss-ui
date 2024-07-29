import {
    InputAdornment as MuiInputAdornment,
    InputAdornmentProps as MuiInputAdornmentProps,
    SxProps,
} from "@mui/material";

export interface InputAdornmentProps extends MuiInputAdornmentProps {
    /** custom style object */
    sx?: SxProps;
}

export const InputAdornment = (props: InputAdornmentProps) => {
    const { sx } = props;
    return <MuiInputAdornment sx={sx} {...props} />;
};
