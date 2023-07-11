import { Checkbox as MuiCheckbox } from "@mui/material";
import { SxProps } from "@mui/system";
import { FormControlLabel } from "../../";

export interface CheckboxProps {
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    //** determines default checked state */
    defaultChecked?: boolean;

    /**
     * The id of the `input` element.
     */
    id?: string;

    /**
     * [Attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Attributes) applied to the `input` element.
     */
    inputProps?: object;

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

export interface FormCheckboxProps {
    /**
     * If `true`, the component appears selected.
     */
    checked?: boolean;

    /**
     * A control element. For instance, it can be a `Radio`, a `Switch` or a `Checkbox`.
     */
    control?: React.ReactElement<any, any>;

    /**
     * If `true`, the control is disabled.
     */
    disabled?: boolean;

    /**
     * If `true`, the label is rendered as it is passed without an additional typography node.
     */
    disableTypography?: boolean;

    /**
     * Pass a ref to the `input` element.
     */
    inputRef?: React.Ref<any>;

    /**
     * A text or an element to be used in an enclosing label element.
     */
    label: React.ReactNode;

    /**
     * The position of the label.
     * @default 'end'
     */
    labelPlacement?: "end" | "start" | "top" | "bottom";

    //** name to be utilized */
    name?: string;

    /**
     * Callback fired when the state is changed.
     *
     * @param {React.SyntheticEvent} event The event source of the callback.
     * You can pull out the new checked state by accessing `event.target.checked` (boolean).
     */
    onChange?: (event: React.SyntheticEvent, checked: boolean) => void;

    /**
     * If `true`, the label will indicate that the `input` is required.
     */
    required?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The value of the component.
     */

    value?: unknown;

    //** below are checkbox specific props within the FormControlLabel control prop */

    //** determines default checked state */
    defaultChecked?: boolean;

    /**
     * The id of the `input` element.
     */
    id?: string;

    /**
     * The size of the component.
     * `small` is equivalent to the dense checkbox styling.
     * @default 'medium'
     */
    size?: "medium" | "small";
}

export const _Checkbox = (props: CheckboxProps) => {
    const { sx } = props;
    return <MuiCheckbox sx={sx} {...props}></MuiCheckbox>;
};

export const Checkbox = (props: FormCheckboxProps) => {
    const { sx, defaultChecked, size, id } = props;

    return (
        <FormControlLabel
            sx={sx}
            {...props}
            control={
                <_Checkbox
                    defaultChecked={defaultChecked}
                    size={size}
                    id={id}
                />
            }
        />
    );
};
