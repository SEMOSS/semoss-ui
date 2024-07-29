import { FormControl as MuiFormControl, SxProps } from "@mui/material";

export interface FormControlProps {
    /**
     * The content of the component.
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
     * If `true`, the label, input and helper text should be displayed in a disabled state.
     * @default false
     */
    disabled?: boolean;

    /**
     * If `true`, the label is displayed in an error state.
     * @default false
     */
    error?: boolean;

    /**
     * If `true`, the component will take up the full width of its container.
     * @default false
     */
    fullWidth?: boolean;

    /**
     * If `true`, the component is displayed in focused state.
     */
    focused?: boolean;

    /**
     * If `true`, the label is hidden.
     * This is used to increase density for a `FilledInput`.
     * Be sure to add `aria-label` to the `input` element.
     * @default false
     */
    hiddenLabel?: boolean;

    /**
     * If `dense` or `normal`, will adjust vertical spacing of this and contained components.
     * @default 'none'
     */
    margin?: "dense" | "normal" | "none";

    /**
     * If `true`, the label will indicate that the `input` is required.
     * @default false
     */
    required?: boolean;

    /**
     * The size of the component.
     * @default 'medium'
     */
    size?: "small" | "medium";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The variant to use.
     * @default 'outlined'
     */
    variant?: "standard" | "outlined" | "filled";
}

export const FormControl = (props: FormControlProps) => {
    const { sx } = props;
    return <MuiFormControl sx={sx} {...props} />;
};
