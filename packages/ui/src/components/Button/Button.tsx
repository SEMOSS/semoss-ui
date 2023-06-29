import MuiButton from "@mui/material/Button";
import { SxProps } from "@mui/system";

export interface ButtonProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

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
        | "success"
        | "error"
        | "info"
        | "warning";

    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * If `true`, no elevation is used.
     * @default false
     */
    disableElevation?: boolean;

    /**
     * Element placed after the children.
     */
    endIcon?: React.ReactNode;

    /**
     * If `true`, the button will take up the full width of its container.
     * @default false
     */
    fullWidth?: boolean;

    /**
     * The URL to link to when the button is clicked.
     * If defined, an `a` element will be used as the root node.
     */
    href?: string;

    //** callback to fire when clicking component */
    onClick?: (e: any) => void;

    /**
     * The size of the component.
     * `small` is equivalent to the dense button styling.
     * @default 'medium'
     */
    size?: "small" | "medium" | "large";

    /**
     * Element placed before the children.
     */
    startIcon?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The variant to use.
     * @default 'text'
     */
    variant?: "text" | "outlined" | "contained";
}

export const Button = (props: ButtonProps) => {
    return <MuiButton {...props}>{props.children}</MuiButton>;
};
