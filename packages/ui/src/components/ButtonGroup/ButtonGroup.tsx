import { ReactNode } from "react";
import MuiButtonGroup from "@mui/material/ButtonGroup";

// import {
//     ButtonGroupProps as MuiTextFieldProps,
// } from "@mui/material";

export interface ButtonGroupProps {
    /**
     * The content of the component.
     */
    children: ReactNode;
    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?:
        | "inherit"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * If `true`, the buttons will take up the full width of its container.
     * @default false
     */
    fullWidth?: boolean;
    /**
     * The component orientation (layout flow direction).
     * @default 'horizontal'
     */
    orientation?: "vertical" | "horizontal";

    /**
     * The size of the component.
     * `small` is equivalent to the dense button styling.
     * @default 'medium'
     */
    size?: "small" | "medium" | "large";

    /**
     * The variant to use.
     * @default 'outlined'
     */
    variant?: "text" | "outlined" | "contained";
    title?: string;
}

export const ButtonGroup = (props: ButtonGroupProps) => {
    return <MuiButtonGroup {...props}>{props.children}</MuiButtonGroup>;
};
