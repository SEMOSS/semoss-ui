import MuiCheckbox from "@mui/material/Checkbox";
import { ReactNode } from "react";
import { SxProps } from "@mui/system";
import { CheckboxProps as MuiCheckboxProps } from "@mui/material";

export interface CheckboxProps extends MuiCheckboxProps {
    /** children to be rendered */

    /** custom style object */
    sx?: SxProps;
    checked?: boolean;
    checkedIcon?: React.ReactNode;
    classes?: object;
    color?:
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
    defaultChecked?: boolean;
    disabled?: boolean;
    disableRipple?: boolean;
    icon?: React.ReactNode;
    id?: string;
    indeterminate?: boolean;
    indeterminateIcon?: React.ReactNode;
    inputProps?: object;
    inputRef?: React.Ref<any>;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    size?: "medium" | "small";
    value?: any;
}

export const Checkbox = (props: CheckboxProps) => {
    const { sx } = props;
    return <MuiCheckbox sx={sx} {...props}></MuiCheckbox>;
};
