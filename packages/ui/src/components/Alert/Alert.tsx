import { ReactNode } from "react";
import MuiAlert from "@mui/material/Alert";
import { SxProps } from "@mui/system";

export type AlertColor = "success" | "info" | "warning" | "error";

export interface AlertProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;

    /**
     * The action to display. It renders after the message, at the end of the alert.
     */
    action?: React.ReactNode;

    /**
     * Override the default label for the *close popup* icon button.
     *
     * For localization purposes, you can use the provided [translations](/material-ui/guides/localization/).
     * @default 'Close'
     */
    closeText?: string;

    /**
     * The color of the component. Unless provided, the value is taken from the `severity` prop.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     */
    color?: AlertColor;

    /**
     * The severity of the alert. This defines the color and icon used.
     * @default 'success'
     */
    severity?: AlertColor;

    /**
     * Override the icon displayed before the children.
     * Unless provided, the icon is mapped to the value of the `severity` prop.
     * Set to `false` to remove the `icon`.
     */
    icon?: React.ReactNode;

    /**
     * Callback fired when the component requests to be closed.
     * When provided and no `action` prop is set, a close icon button is displayed that triggers the callback when clicked.
     * @param {React.SyntheticEvent} event The event source of the callback.
     */
    onClose?: (event: React.SyntheticEvent) => void;

    /**
     * The variant to use.
     * @default 'standard'
     */
    variant?: "standard" | "filled" | "outlined";
}

export const Alert = (props: AlertProps) => {
    const { children, sx } = props;
    return (
        <MuiAlert sx={sx} {...props}>
            {children}
        </MuiAlert>
    );
};
