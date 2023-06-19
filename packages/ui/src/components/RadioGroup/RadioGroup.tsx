import { ReactNode } from "react";
import MuiRadioGroup from "@mui/material/RadioGroup";
import MuiRadio from "@mui/material/Radio";
import { SxProps } from "@mui/system";
import {
    RadioGroupProps as MuiRadioGroupProps,
    RadioProps as MuiRadioProps,
} from "@mui/material";

export interface RadioProps extends MuiRadioProps {
    /** custom style object */
    sx?: SxProps;
}

export interface RadioGroupProps extends MuiRadioGroupProps {
    /** custom style object */
    sx?: SxProps;
}

export const Radio = (props: RadioProps) => {
    const { sx } = props;

    return <MuiRadio sx={sx} {...props} />;
};

export const RadioGroup = (props: RadioGroupProps) => {
    const { sx } = props;
    return <MuiRadioGroup sx={sx} {...props} />;
};
