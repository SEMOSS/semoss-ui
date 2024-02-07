import {
    ToggleButtonGroup as MuiToggleButtonGroup,
    SxProps,
} from '@mui/material';

export interface ToggleButtonGroupProps<V> {
    /**
     * The currently selected value within the group or an array of selected
     * values when `exclusive` is false.
     *
     * The value must have reference equality with the option in order to be selected.
     */
    value?: V;

    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * The color of the button when it is selected.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'standard'
     */
    color?:
        | 'standard'
        | 'primary'
        | 'secondary'
        | 'error'
        | 'info'
        | 'success'
        | 'warning';

    /**
     * If `true`, only allow one of the child ToggleButton values to be selected.
     * @default false
     */
    exclusive?: boolean;

    /**
     * If `true`, the component is disabled. This implies that all ToggleButton children will be disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * If `true`, the button group will take up the full width of its container.
     * @default false
     */
    fullWidth?: boolean;

    /**
     * The component orientation (layout flow direction).
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical';

    /**
     * The size of the component.
     * @default 'medium'
     */
    size?: 'small' | 'medium' | 'large';

    /** custom style object */
    sx?: SxProps;
}

export const ToggleButtonGroup = (
    props: ToggleButtonGroupProps<boolean | string | number>,
) => {
    return (
        <MuiToggleButtonGroup {...props}>{props.children}</MuiToggleButtonGroup>
    );
};
