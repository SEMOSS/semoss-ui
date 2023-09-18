import {
    CircularProgress as MuiCircularProgress,
    SxProps,
} from "@mui/material";

export interface CircularProgressProps {
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
        | "inherit";

    /**
     * If `true`, the shrink animation is disabled.
     * This only works if variant is `indeterminate`.
     * @default false
     */
    disableShrink?: boolean;

    /**
     * The size of the component.
     * If using a number, the pixel unit is assumed.
     * If using a string, you need to provide the CSS unit, e.g '3rem'.
     * @default 40
     */
    size?: number | string;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The thickness of the circle.
     * @default 3.6
     */
    thickness?: number;

    /**
     * The value of the progress indicator for the determinate variant.
     * Value between 0 and 100.
     * @default 0
     */
    value?: number;

    /**
     * The variant to use.
     * Use indeterminate when there is no progress value.
     * @default 'indeterminate'
     */
    variant?: "determinate" | "indeterminate";
}

export const CircularProgress = (props: CircularProgressProps) => {
    const { sx } = props;
    return <MuiCircularProgress sx={sx} {...props} />;
};
