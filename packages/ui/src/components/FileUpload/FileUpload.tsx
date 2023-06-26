import MuiInput from "@mui/material/Input";
import { SxProps } from "@mui/system";

export interface InputProps {
    /** custom style object */
    sx?: SxProps;
}

export const Input = (props: InputProps) => {
    const { sx } = props;
    return (
        <MuiInput type="file" disableUnderline sx={sx} {...props}></MuiInput>
    );
};
