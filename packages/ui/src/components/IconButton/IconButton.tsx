import {
    CircularProgress,
    IconButton as MuiIconButton,
    SxProps,
} from "@mui/material";

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * The icon to display.
     */
    children?: React.ReactNode;

    /**
     * OnClick functionality
     * If defined, this is the function that will be called when the button is pressed
     */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'default'
     */
    color?:
        | "inherit"
        | "default"
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
     * If given, uses a negative margin to counteract the padding on one
     * side (this is often helpful for aligning the left or right
     * side of the icon with content above or below, without ruining the border
     * size and shape).
     * @default false
     */
    edge?: "start" | "end" | false;

    /**
     * Set loading state
     */
    loading?: boolean;

    /**
     * The size of the component.
     * `small` is equivalent to the dense button styling.
     * @default 'medium'
     */
    size?: "small" | "medium" | "large";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
    title?: string;
}

export const IconButton = (props: IconButtonProps) => {
    let muiIconButtonProps = { ...props };
    if (muiIconButtonProps?.loading) {
        delete muiIconButtonProps.loading;
    }

    return (
        <MuiIconButton
            {...muiIconButtonProps}
            disabled={props?.disabled || props?.loading}
        >
            {props?.loading ? (
                <CircularProgress color="inherit" size="1em" />
            ) : (
                props?.children
            )}
        </MuiIconButton>
    );
};
