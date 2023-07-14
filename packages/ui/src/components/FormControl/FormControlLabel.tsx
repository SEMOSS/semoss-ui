import MuiFormControlLabel from "@mui/material/FormControlLabel";
import { SxProps } from "@mui/system";

export interface FormControlLabelProps {
    /**
     * If `true`, the component appears selected.
     */
    checked?: boolean;

    /**
     * A control element. For instance, it can be a `Radio`, a `Switch` or a `Checkbox`.
     */
    control: React.ReactElement;

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
}

export const FormControlLabel = (props: FormControlLabelProps) => {
    const { sx } = props;
    return <MuiFormControlLabel sx={sx} {...props} />;
};
