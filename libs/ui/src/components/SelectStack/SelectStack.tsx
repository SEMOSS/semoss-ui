import styled from "@emotion/styled";
import { InfoOutlined } from "@mui/icons-material";
import {
	TextField as MuiTextField,
	type TextFieldProps as MuiTextFieldProps,
	InternalStandardProps as StandardProps,
	type SxProps,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { lightTheme } from "../../theme";
import { InputAdornment } from "../InputAdornment";

export interface SelectStackProps {
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
	SelectProps?: MuiTextFieldProps["SelectProps"];

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
const StyledInputLabel = styled("label")(({}) => ({
	display: "flex",
	flexDirection: "row",
	gap: "4px",
	marginBottom: "8px",
}));

const StyledTypography = styled(Typography)(({}) => ({
	color: lightTheme.palette.text.secondary,
	fontFamily: lightTheme.typography.fontFamily,
	fontSize: lightTheme.typography.body2.fontSize,
	fontStyle: lightTheme.typography.body2.fontStyle,
	fontWeight: lightTheme.typography.body2.fontWeight,
	lineHeight: lightTheme.typography.body2.lineHeight,
	letterSpacing: lightTheme.typography.body2.letterSpacing,
}));

export const SelectStack = (props: SelectStackProps) => {
	const { variant = "outlined" } = props;
	const [componentId, setComponentId] = useState("");
	useEffect(() => {
		if (!componentId) {
			// gets rid of suggestions
			setComponentId(`generated-id-${Date.now()}`);
		}
	}, []);
	return (
		<>
			<StyledInputLabel htmlFor={componentId}>
				<StyledTypography variant="body2">
					{props.label ?? "Label"}
				</StyledTypography>
				{props.helperText ? (
					<InfoOutlined
						fontSize="small"
						color="action"
						titleAccess={props.helperText?.toString()}
					/>
				) : (
					<></>
				)}
			</StyledInputLabel>
			<MuiTextField
				select
				{...props}
				id={componentId}
				label=""
				helperText=""
			/>
		</>
	);
};
