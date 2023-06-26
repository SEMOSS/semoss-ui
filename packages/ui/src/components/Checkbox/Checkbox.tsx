import MuiCheckbox from "@mui/material/Checkbox";
import { SxProps } from "@mui/system";

export interface CheckboxProps {
    /** custom style object */
    sx?: SxProps;

    /**
     * If `true`, the component is checked.
     */
    checked?: boolean;

    /**
     * The icon to display when the component is checked.
     * @default <CheckBoxIcon />
     */
    checkedIcon?: React.ReactNode;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?:
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";

    //** determines default checked state */
    defaultChecked?: boolean;

    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * The id of the `input` element.
     */
    id?: string;

    /**
     * [Attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Attributes) applied to the `input` element.
     */
    inputProps?: object;

    /**
     * Pass a ref to the `input` element.
     */
    inputRef?: React.Ref<any>;

    /**
     * Callback fired when the state is changed.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
     * You can pull out the new checked state by accessing `event.target.checked` (boolean).
     */
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

    /**
     * If `true`, the `input` element is required.
     * @default false
     */
    required?: boolean;

    /**
     * The size of the component.
     * `small` is equivalent to the dense checkbox styling.
     * @default 'medium'
     */
    size?: "medium" | "small";

    /**
     * The value of the component. The DOM API casts this to a string.
     * The browser uses "on" as the default value.
     */
    value?: any;
}

export const Checkbox = (props: CheckboxProps) => {
    const { sx } = props;
    return <MuiCheckbox sx={sx} {...props}></MuiCheckbox>;
};
