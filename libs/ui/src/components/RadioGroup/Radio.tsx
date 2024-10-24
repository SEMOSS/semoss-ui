import { Radio as MuiRadio, SxProps, Typography } from "@mui/material";
import { FormControlLabel } from "../FormControl";

export interface RadioProps {
    /**
     * If `true`, the component appears selected.
     */
    checked?: boolean;

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

    radioProps?: {
        /**
         * The icon to display when the component is checked.
         * @default <RadioButtonIcon checked />
         */
        checkedIcon?: React.ReactNode;

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
            | "default";

        /**
         * If `true`, the component is disabled.
         */
        disabled?: boolean;

        /**
         * The icon to display when the component is unchecked.
         * @default <RadioButtonIcon />
         */
        icon?: React.ReactNode;

        /**
         * The size of the component.
         * `small` is equivalent to the dense radio styling.
         * @default 'medium'
         */
        size?: "small" | "medium";
        /**
         * The system prop that allows defining system overrides as well as additional CSS styles.
         */
        sx?: SxProps;
    };
}

export const Radio = (props: RadioProps) => {
    const { radioProps, label } = props;

    return (
        <FormControlLabel
            {...props}
            label={<Typography variant="body2">{label}</Typography>}
            control={<MuiRadio {...radioProps} />}
        />
    );
};
