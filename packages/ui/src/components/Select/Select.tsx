import { TextField } from "@mui/material";
import { SxProps } from "@mui/system";

export interface SelectProps {
<<<<<<< HEAD
    /**
     * This prop helps users to fill forms faster, especially on mobile devices.
     * The name can be confusing, as it's more like an autofill.
     * You can learn more about it [following the specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill).
     */
    autoComplete?: string;

    /**
     * If `true`, the `input` element is focused during the first mount.
     * @default false
     */
    autoFocus?: boolean;

    /**
     * @ignore
     */
    children?: React.ReactNode;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";

    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: unknown;

    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * If `true`, the label is displayed in an error state.
     * @default false
     */
    error?: boolean;

    /**
     * If `true`, the input will take up the full width of its container.
     * @default false
     */
    fullWidth?: boolean;

    /**
     * The helper text content.
     */
    helperText?: React.ReactNode;

    /**
     * The id of the `input` element.
     * Use this prop to make `label` and `helperText` accessible for screen readers.
     */
    id?: string;

    /**
     * Pass a ref to the `input` element.
     */
    inputRef?: React.Ref<HTMLInputElement>;

    /**
     * The label content.
     */
    label?: React.ReactNode;

    /**
     * Name attribute of the `input` element.
     */
    name?: string;

    /** funciton fired as input changes */
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

    /**
     * The short hint displayed in the `input` before the user enters a value.
     */
    placeholder?: string;

    /**
     * If `true`, the label is displayed as required and the `input` element is required.
     * @default false
     */
    required?: boolean;

    /**
     * The size of the component.
     */
    size?: "small" | "medium";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
=======
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
>>>>>>> ddfe6a8 (corrected types)
    sx?: SxProps;

    /**
     * The value of the `input` element, required for a controlled component.
     */
    value?: unknown;

    /** style variant
     * @default outlined
     */
    variant?: "outlined" | "standard" | "filled";
}

export const Select = (props: SelectProps) => {
    const { sx } = props;
    return <TextField variant="outlined" select sx={sx} {...props} />;
};
