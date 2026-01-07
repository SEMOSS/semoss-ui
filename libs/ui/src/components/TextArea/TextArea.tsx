import {
	type InputProps as MuiInputProps,
	type TextFieldProps as MuiTextFieldProps,
	TextField as MuiTextfield,
	type SxProps,
} from "@mui/material";

export type TextAreaProps = MuiInputProps &
	MuiTextFieldProps & {
		/** custom style object */
		sx?: SxProps;

		/** amount of rows to render */
		rows?: number;

		/**
		 * The value to associated with the input element (if controlled).
		 */
		value?: unknown;

		/** min number of rows that can be rendered */
		minRows?: number;

		/** maxiumum number of rows that can be rendered */
		maxRows?: number;

		/** text to display on input */
		label?: string | number;

		/** placeholder text displayed within textarea */
		placeholder?: string | number;

		/** callback function triggered when the value changes */
		onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	};

export const TextArea = (props: TextAreaProps) => {
	const {
		rows,
		minRows,
		maxRows,
		label,
		multiline = true,
		placeholder,
		onChange,
	} = props;
	return (
		<MuiTextfield
			{...props}
			rows={rows}
			minRows={minRows}
			maxRows={maxRows}
			label={label}
			multiline={multiline}
			placeholder={placeholder}
			onChange={onChange}
		/>
	);
};
