import * as React from "react";
import { RadioGroup as MuiRadioGroup } from "@mui/material";
import { SxProps } from "@mui/system";
<<<<<<< HEAD
import { FormLabel } from "../../";

export interface RadioGroupProps {
=======
import { RadioGroupProps as MuiRadioGroupProps } from "@mui/material";

export interface RadioProps {
>>>>>>> ddfe6a8 (corrected types)
    /** custom style object */
    children?: React.ReactNode;

<<<<<<< HEAD
    // * You can pull out the new value by accessing `event.target.value` (string).
    // */
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
=======
export interface RadioGroupProps extends MuiRadioGroupProps {
    /** custom style object */
    children?: ReactNode;

    // * You can pull out the new value by accessing `event.target.value` (string).
    // */
    onChange?: (event: any) => void;
>>>>>>> ddfe6a8 (corrected types)
    /**
     * The name used to reference the value of the control.
     * If you don't provide this prop, it falls back to a randomly generated name.
     */
    name?: string;
<<<<<<< HEAD

    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: string;

    /**
     * Value of the selected radio button. The DOM API casts this to a string.
     */
    value?: string;

    /** radio group label */
    label?: string | number;

=======
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: any;
>>>>>>> ddfe6a8 (corrected types)
    sx?: SxProps;
    /**
     * Changes the orientation of the radio group.
     */
    row?: boolean;
}

export const RadioGroup = (props: RadioGroupProps) => {
    const { sx, label } = props;
    return (
        <>
            <FormLabel>{label}</FormLabel>
            <MuiRadioGroup sx={sx} {...props} />
        </>
    );
};
