import React, { ReactNode } from "react";
import MuiSnackbar from "@mui/material/Snackbar";
import { SxProps } from "@mui/system";

interface anchorOriginProps {
    horizontal: "center" | "left" | "right";
    vertical: "bottom" | "top";
}
export interface SnackbarProps {
    /**
     * The action to display. It renders after the message, at the end of the snackbar.
     */
    action?: ReactNode;
    /**
     * If `true`, the component is shown.
     */
    open: boolean;
    /**
     * Replace the `SnackbarContent` component.
     */
    children: React.ReactElement<any, any>;
    /**
     * The anchor of the `Snackbar`.
     * On smaller screens, the component grows to occupy all the available width,
     * the horizontal alignment is ignored.
     * @default { vertical: 'bottom', horizontal: 'left' }
     */
    anchorOrigin?: anchorOriginProps;
    /**
     * The number of milliseconds to wait before automatically calling the
     * `onClose` function. `onClose` should then set the state of the `open`
     * prop to hide the Snackbar. This behavior is disabled by default with
     * the `null` value.
     * @default null
     */
    autoHideDuration?: number | null;
    /**
     * Callback fired when the component requests to be closed.
     * Typically `onClose` is used to set state in the parent component,
     * which is used to control the `Snackbar` `open` prop.
     * The `reason` parameter can optionally be used to control the response to `onClose`,
     * for example ignoring `clickaway`.
     *
     * @param {React.SyntheticEvent<any> | Event} event The event source of the callback.
     * @param {string} reason Can be: `"timeout"` (`autoHideDuration` expired), `"clickaway"`, or `"escapeKeyDown"`.
     */
    onClose?: () => void;
    /**
     * The message to display.
     */
    message?: ReactNode;
    sx?: SxProps;
}

export const Snackbar = (props: SnackbarProps) => {
    const { sx } = props;
    return <MuiSnackbar sx={sx} {...props} />;
};
