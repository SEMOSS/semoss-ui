import { TextField as MuiTextField, type SxProps } from "@mui/material";

export interface TextFieldProps {
	/**
	 * The value to associated with the input element (if controlled).
	 */
	value?: unknown;

	/**
	 * The value to associated with the input element (if uncontrolled).
	 */
	defaultValue?: unknown;

	/**
	 * If `true`, the input is disabled.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * If `true`, the input is required.
	 * @default false
	 */
	required?: boolean;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

	/**
	 * The type of the input element.
	 * @default "text"
	 */
	type?: HTMLInputElement["type"];

	/**
	 * The id of the `input` element.
	 * Use this prop to make `label` and `helperText` accessible for screen readers.
	 */
	id?: string;

	/**
	 * Title of the element
	 */
	title?: string;

	/**
	 * Label text for the input element.
	 * @default ""
	 */
	label?: React.ReactNode;

	/**
	 * Help text for the input element.
	 * @default ""
	 */
	helperText?: React.ReactNode;

	/**
	 * Placeholder text for the input element.
	 * @default ""
	 */
	placeholder?: string;

	/**
	 * Size of the text field
	 */
	size?: "small" | "medium";

	/**
	 * Size of the text field
	 * @default "outlined"
	 */
	variant?: "outlined" | "filled";

	/**
	 * Fullwidth of the field
	 */
	fullWidth?: boolean;

	/**
	 * Should it span multiple lines?
	 */
	multiline?: boolean;

	/**
	 * Minimum number of rows to display when multiline is true
	 */
	minRows?: number;

	/**
	 * Maximum of rows to display when multiline is true
	 */
	rows?: number;

	/**
	 * Maximum number of rows to display when multiline is true
	 */
	maxRows?: number;

	/**
	 * @deprecated Use the <Select> component instead.
	 * If `true`, render as a select element.
	 * @default false
	 */
	select?: boolean;

	/**
	 * Children to pass to the TextField. Typically the Select Items. Try to use the <Select> component instead.
	 */
	children?: React.ReactNode;

	/**
	 * If `true`, the input will be focused during the first mount.
	 * @default false
	 */
	autoFocus?: boolean;

	/**
	 * Helps browser autofill the input.
	 * @default "off"
	 */
	autoComplete?: string;

	/**
	 * Access the underlying input element.
	 */
	inputRef?: React.Ref<HTMLInputElement>;

	/**
	 * Properties to pass to the input element.
	 */
	slotProps?: {
		htmlInput?: React.InputHTMLAttributes<HTMLInputElement> & {
			ref: React.Ref<HTMLInputElement>;
		};
		input?: {
			startAdornment?: React.ReactNode;
			endAdornment?: React.ReactNode;
		};
		label?: {
			shrink?: boolean;
		};
	};

	/**
	 * @deprecated
	 * The props pass to the html input
	 * @default {}
	 */
	inputProps?: React.InputHTMLAttributes<HTMLInputElement> & {
		ref: React.Ref<HTMLInputElement>;
	};

	/**
	 * @deprecated
	 * The props pass to the Input Component
	 * @default {}
	 */
	InputProps?: {
		startAdornment?: React.ReactNode;
		endAdornment?: React.ReactNode;
	};

	/**
	 * @deprecated
	 * The props passed to the label
	 * @default {}
	 */
	InputLabelProps?: {
		shrink?: boolean;
	} & Omit<React.HTMLAttributes<HTMLLabelElement>, "color">;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onScroll?: (event: React.UIEvent<HTMLInputElement>) => void;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onDrop?: (event: React.DragEvent<HTMLInputElement>) => void;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onDragOver?: (event: React.DragEvent<HTMLInputElement>) => void;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onDragLeave?: (event: React.DragEvent<HTMLInputElement>) => void;

	/**
	 * Callback that is triggered when the value changes.
	 */
	onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;

	/**
	 * Custom Style
	 */
	sx?: SxProps;
}

export const TextField: React.FC<TextFieldProps> = ({
	type = "text",
	autoComplete = "off",
	sx,
	...otherProps
}) => {
	return (
		<MuiTextField
			type={type}
			autoComplete={autoComplete}
			sx={sx}
			{...otherProps}
		/>
	);
};
