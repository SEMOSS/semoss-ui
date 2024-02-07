import { ReactNode } from 'react';
import { ToggleButton as MuiToggleButton, SxProps } from '@mui/material';

export interface ToggleButtonProps<V> {
    /**
     * The value to associate with the button when selected in a
     * ToggleButtonGroup.
     */
    value: V;
    /**
     * The color of the button when it is in an active state.
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
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * If `true`, the button will take up the full width of its container.
     * @default false
     */
    fullWidth?: boolean;
    /**
     * Callback fired when the state changes.
     *
     * @param {React.MouseEvent<HTMLElement>} event The event source of the callback.
     * @param {any} value of the selected button.
     */
    onChange?: (event: React.MouseEvent<HTMLElement>, value: V) => void;
    /**
     * Callback fired when the button is clicked.
     *
     * @param {React.MouseEvent<HTMLElement>} event The event source of the callback.
     * @param {any} value of the selected button.
     */
    onClick?: (event: React.MouseEvent<HTMLElement>, value: V) => void;
    /**
     * If `true`, the button is rendered in an active state.
     */
    selected?: boolean;
    /**
     * The size of the component.
     * The prop defaults to the value inherited from the parent ToggleButtonGroup component.
     * @default 'medium'
     */
    size?: 'small' | 'medium' | 'large';

    children?: ReactNode;
    /** custom style object */
    sx?: SxProps;
}

export const ToggleButton = <V extends string | number | boolean>(
    props: ToggleButtonProps<V>,
) => {
    return <MuiToggleButton {...props}>{props.children}</MuiToggleButton>;
};
