import {
    TextField as MuiTextField,
    SxProps,
    InternalStandardProps as StandardProps,
} from "@mui/material";
import { InputAdornment } from "../InputAdornment";

export interface SelectProps {
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
     * If `true`, the label is displayed as required and the `input` element is required.
     * @default false
     */
    SelectProps?: {
        IconComponent?: React.ElementType;
        startAdornment?:
            | React.ElementType
            | React.ReactElement<typeof InputAdornment>;
        style?: React.CSSProperties;
        multiple?: boolean;
        value?: string[];
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };

    /**
     * Tooltip text
     */
    title?: string;

    /**
     * The size of the component.
     */
    size?: "small" | "medium";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The value of the `input` element, required for a controlled component.
     */
    value?: unknown;

    /** style variant
     * @default outlined
     */
    variant?: "outlined" | "standard";

    InputProps?: unknown;
}

export const Select = (props: SelectProps) => {
    const { variant = "outlined" } = props;
    return <MuiTextField variant={variant} select {...props} />;
};
