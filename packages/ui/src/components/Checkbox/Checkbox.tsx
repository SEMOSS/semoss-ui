import { Checkbox as MuiCheckbox, SxProps } from "@mui/material";

import { FormControlLabel } from "../FormControl";

export interface CheckboxProps {
    /**
     * If `true`, the component appears selected.
     */
    checked?: boolean;

    //** determines default checked state */
    defaultChecked?: boolean;

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
    inputRef?: React.Ref<HTMLInputElement>;

    /**
     * A text or an element to be used in an enclosing label element.
     */
    label?: React.ReactNode;

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

    /**
     * The id of the `input` element.
     */
    id?: string;

    checkboxProps?: {
        /**
         * The system prop that allows defining system overrides as well as additional CSS styles.
         */
        sx?: SxProps;

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
        value?: boolean;
    };
}

export const Checkbox = (props: CheckboxProps) => {
    const { checkboxProps, label = "" } = props;
    return (
        <FormControlLabel
            {...props}
            label={label}
            control={<MuiCheckbox {...checkboxProps} />}
        />
    );
};
