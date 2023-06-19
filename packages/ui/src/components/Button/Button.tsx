import MuiButton from "@mui/material/Button";
import { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import { SxProps } from "@mui/system";

export interface ButtonProps extends MuiButtonProps {
    /** custom style object */
    sx?: SxProps;
}

export const Button = (props: ButtonProps) => {
    return <MuiButton {...props}>{props.children}</MuiButton>;
};
