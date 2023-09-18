import { Slider as MuiSlider, SxProps } from "@mui/material";

export interface SliderProps {
    /** custom style object */
    sx?: SxProps;
    /**
     * The label of the slider.
     */
    "aria-label"?: string;
    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?: "primary" | "secondary";
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * The maximum allowed value of the slider.
     * Should not be equal to min.
     * @default 100
     */
    max?: number;
    /**
     * The minimum allowed value of the slider.
     * Should not be equal to max.
     * @default 0
     */
    min?: number;
    /**
     * The granularity with which the slider can step through values. (A "discrete" slider.)
     * The `min` prop serves as the origin for the valid values.
     * We recommend (max - min) to be evenly divisible by the step.
     *
     * When step is `null`, the thumb can only be slid onto marks provided with the `marks` prop.
     * @default 1
     */
    step?: number;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: number;
    /**
     * Marks indicate predetermined values to which the user can move the slider.
     * If `true` the marks are spaced according the value of the `step` prop.
     * If an array, it should contain objects with `value` and an optional `label` keys.
     * @default false
     */
    marks?: boolean;
    onChange?: () => void;
    /**
     * The size of the slider.
     * @default 'medium'
     */
    size?: "medium" | "small";
}

export const Slider = (props: SliderProps) => {
    const { sx } = props;
    return <MuiSlider sx={sx} {...props} />;
};
