import MuiInput from "@mui/material/Input";
import { SxProps } from "@mui/system";

import {
    TextFieldProps as MuiTextFieldProps,
    InputProps as MuiInputProps,
} from "@mui/material";

export type InputProps = MuiInputProps &
    MuiTextFieldProps & {
        /** custom style object */
        sx?: SxProps;
    };

export const Input = (props: InputProps) => {
    return <MuiInput variant={"outlined"} {...props}></MuiInput>;
};
