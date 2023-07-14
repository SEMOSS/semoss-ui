import * as React from "react";
import { RadioGroup as MuiRadioGroup } from "@mui/material";
import { SxProps } from "@mui/system";
import { FormLabel } from "../../";

export interface RadioGroupProps {
    /** custom style object */
    children?: React.ReactNode;

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

    /**
     * Value of the selected radio button. The DOM API casts this to a string.
     */
    value?: string;

    /** radio group label */
    label?: string | number;

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
