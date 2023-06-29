import { ReactNode } from "react";
import MuiSelect from "@mui/material/Select";
import { SxProps } from "@mui/system";

export interface SelectProps {
    /** custom style object */
    /**
     * Callback fired when a menu item is selected.
     *
     * @param {SelectChangeEvent<T>} event The event source of the callback.
     * You can pull out the new value by accessing `event.target.value` (any).
     * **Warning**: This is a generic event, not a change event, unless the change event is caused by browser autofill.
     * @param {object} [child] The react element that was selected when `native` is `false` (default).
     */
    onChange: (event: any) => void;
    /**
     * The `input` value. Providing an empty string will select no options.
     * Set to an empty string `''` if you don't want any of the available options to be selected.
     *
     * If the value is an object it must have reference equality with the option in order to be selected.
     * If the value is not an object, the string representation must match with the string representation of the option in order to be selected.
     */
    value: "" | any;

    /**
     * The option elements to populate the select with.
     * Can be some `MenuItem` when `native` is false and `option` when `native` is true.
     *
     * The `MenuItem` elements **must** be direct descendants when `native` is false.
     */
    children?: ReactNode;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: any;
    /**
     * If `true`, `value` must be an array and the menu will support multiple selections.
     * @default false
     */
    multiple?: boolean;
    /**
     * Callback fired when the component requests to be closed.
     * Use it in either controlled (see the `open` prop), or uncontrolled mode (to detect when the Select collapses).
     *
     * @param {object} event The event source of the callback.
     */
    onClose?: () => void;
    /**
     * If `true`, the component is shown.
     * You can only use it when the `native` prop is `false` (default).
     */
    open?: boolean;
    /**
     * The variant to use.
     * @default 'outlined'
     */

    /**
     * Render the selected value.
     * You can only use it when the `native` prop is `false` (default).
     *
     * @param {any} value The `value` provided to the component.
     * @returns {ReactNode}
     */
    renderValue?: (value: any) => ReactNode;
    variant?: "filled" | "outlined" | "standard";
    sx?: SxProps;
}

export const Select = (props: SelectProps) => {
    const { sx } = props;
    return <MuiSelect sx={sx} {...props} />;
};
