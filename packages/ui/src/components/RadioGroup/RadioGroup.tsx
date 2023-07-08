import { ReactNode } from "react";
import MuiRadioGroup from "@mui/material/RadioGroup";
import MuiRadio from "@mui/material/Radio";
import { SxProps } from "@mui/system";
import { RadioGroupProps as MuiRadioGroupProps } from "@mui/material";

export interface RadioProps {
    /** custom style object */
    sx?: SxProps;
}

export interface RadioGroupProps extends MuiRadioGroupProps {
    /** custom style object */
    children?: ReactNode;

    // * You can pull out the new value by accessing `event.target.value` (string).
    // */
    onChange?: (event: any) => void;
    /**
     * The name used to reference the value of the control.
     * If you don't provide this prop, it falls back to a randomly generated name.
     */
    name?: string;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: any;
    sx?: SxProps;
    /**
     * Changes the orientation of the radio group.
     */
    row?: boolean;
}

export const Radio = (props: RadioProps) => {
    const { sx } = props;

    return <MuiRadio sx={sx} {...props} />;
};

export const RadioGroup = (props: RadioGroupProps) => {
    const { sx } = props;
    return <MuiRadioGroup sx={sx} {...props} />;
};
