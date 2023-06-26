import MuiFormLabel from "@mui/material/FormLabel";
import { SxProps } from "@mui/system";

export interface FormLabelProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     */
    color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";

    /**
     * If `true`, the label should be displayed in a disabled state.
     */
    disabled?: boolean;

    /**
     * If `true`, the label is displayed in an error state.
     */
    error?: boolean;

    /**
     * If `true`, the label should use filled classes key.
     */
    filled?: boolean;

    /**
     * If `true`, the input of this label is focused (used by `FormGroup` components).
     */
    focused?: boolean;

    /**
     * If `true`, the label will indicate that the `input` is required.
     */
    required?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const FormLabel = (props: FormLabelProps) => {
    const { sx } = props;
    return <MuiFormLabel sx={sx} {...props} />;
};
