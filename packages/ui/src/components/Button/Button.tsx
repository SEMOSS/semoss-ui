import { CircularProgress, Button as MuiButton, SxProps } from "@mui/material";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
     * OnChange functionality
     * If defined, this is the function that will be called when the button is pressed
     */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

    /**
     * The URL to link to when the button is clicked.
     * If defined, an `a` element will be used as the root node.
     */
    href?: string;

    /**
     * Will set loading state when true
     */
    loading?: boolean;

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
    title?: string;
}

export const Button = (props: ButtonProps) => {
    const muiButtonProps = { ...props };
    if (muiButtonProps?.loading) {
        delete muiButtonProps.loading;
    }

    const progressCircularSize =
        props?.size === "medium"
            ? "1.5em"
            : props?.size === "small"
            ? "1em"
            : "2em";

    const startIcon =
        props?.loading && props?.startIcon ? (
            <CircularProgress color="inherit" size="1em" />
        ) : (
            props?.startIcon
        );
    const endIcon =
        props?.loading && props?.endIcon ? (
            <CircularProgress size="1em" color="inherit" />
        ) : (
            props?.endIcon
        );

    return (
        <MuiButton
            {...muiButtonProps}
            disabled={props?.disabled || props?.loading}
            startIcon={startIcon}
            endIcon={endIcon}
        >
            <span
                style={{
                    visibility:
                        props?.loading && !(props?.startIcon || props?.endIcon)
                            ? "hidden"
                            : "visible",
                }}
            >
                {props.children}
            </span>
            {props?.loading && !(props?.startIcon || props?.endIcon) ? (
                <CircularProgress
                    color="inherit"
                    size={progressCircularSize}
                    sx={{ zIndex: 10, position: "absolute" }}
                />
            ) : (
                <></>
            )}
        </MuiButton>
    );
};
