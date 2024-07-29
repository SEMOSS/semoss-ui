import { ReactNode } from "react";
import { Alert as MuiAlert, SxProps, styled } from "@mui/material";

export type AlertColor = "success" | "info" | "warning" | "error";

const StyledAlert = styled(MuiAlert, {
    shouldForwardProp: (prop) => prop !== "colorOverride",
})<{ colorOverride: string }>(({ theme, severity, colorOverride }) => ({
    boxShadow: "none",
    borderRadius: "4px",

    ...(severity === "success" && {
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.text,
        "& .MuiAlert-icon": {
            color: theme.palette.success.main,
        },
    }),

    ...(severity === "info" && {
        backgroundColor: theme.palette.primary.selected,
        color: theme.palette.primary.main,
        "& .MuiAlert-icon": {
            color: theme.palette.primary.main,
        },
    }),

    ...(severity === "warning" && {
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.warning.text,
        "& .MuiAlert-icon": {
            color: theme.palette.warning.text,
        },
    }),

    ...(severity === "error" && {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.text,
        "& .MuiAlert-icon": {
            color: theme.palette.error.main,
        },
    }),

    ...(colorOverride === "secondary" && {
        backgroundColor: theme.palette.secondary.light,
        color: theme.palette.text.primary,
        "& .MuiAlert-icon": {
            color: theme.palette.text.primary,
        },
    }),
}));

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
     * ColorOverride is intended to act as a temporary replacement for the custom palette colors to be added to the 'color' prop;
     * its custom types/options need to be enforced via the theme and the "AlertColor" type defined here.
     */
    colorOverride?: "secondary";

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
    const { children, colorOverride, sx } = props;
    return (
        <StyledAlert sx={sx} colorOverride={colorOverride} {...props}>
            {children}
        </StyledAlert>
    );
};
