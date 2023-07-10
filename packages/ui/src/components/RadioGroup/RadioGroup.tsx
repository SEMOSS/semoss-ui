import { ReactNode } from "react";
import MuiRadioGroup from "@mui/material/RadioGroup";
import MuiRadio from "@mui/material/Radio";
import { SxProps } from "@mui/system";
import { RadioGroupProps as MuiRadioGroupProps } from "@mui/material";
import { FormControl, FormLabel } from "../FormControl/index";

export interface RadioProps {
    /**
     * The icon to display when the component is checked.
     * @default <RadioButtonIcon checked />
     */
    checkedIcon?: React.ReactNode;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?:
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning"
        | "default";

    /**
     * If `true`, the component is disabled.
     */
    disabled?: boolean;

    /**
     * The icon to display when the component is unchecked.
     * @default <RadioButtonIcon />
     */
    icon?: React.ReactNode;

    /**
     * The size of the component.
     * `small` is equivalent to the dense radio styling.
     * @default 'medium'
     */
    size?: "small" | "medium";
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
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

    //** radio group label */
    label?: string | number;

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
    const { sx, label } = props;
    return (
        <FormControl>
            <FormLabel>{label}</FormLabel>
            <MuiRadioGroup sx={sx} {...props} />
        </FormControl>
    );
};
