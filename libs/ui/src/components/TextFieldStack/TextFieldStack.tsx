import styled from "@emotion/styled";
import { InfoOutlined } from "@mui/icons-material";
import {
	InputLabel,
	TextField as MuiTextField,
	type TextFieldProps as MuiTextFieldProps,
	type SxProps,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { lightTheme } from "../../theme";

export type TextFieldStackProps = MuiTextFieldProps & {
	/** custom style object */
	sx?: SxProps;
	hint?: string;
};

const StyledInputLabel = styled(InputLabel)(({}) => ({
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

const StyledMuiTextField = styled(MuiTextField)(({}) => ({
	"&.MuiFormControl-root > .MuiInputBase-root": {
		border: "1px solid #C4C4C4",
		borderRadius: "8px",
	},
	"&.MuiFormControl-root > .MuiInputBase-root > input": {
		padding: "8.5px 12px",
		border: "1px solid #C4C4C4",
		borderRadius: "8px",
	},
	"&.MuiFormControl-root > .MuiInputBase-root :focus": {
		border: `1px solid ${lightTheme.palette.primary.main}`,
		borderRadius: "8px",
	},
}));

export const TextFieldStack = (props: TextFieldStackProps) => {
	const { sx, hint = "" } = props;
	const [componentId, setComponentId] = useState(props.id);

	useEffect(() => {
		if (!componentId) {
			// gets rid of suggestions
			setComponentId(`generated-id-${Date.now()}`);
		}
	}, [componentId]);

	return (
		<>
			<StyledInputLabel shrink={false} htmlFor={componentId}>
				<StyledTypography variant="body2">
					{props.label ?? "Label"}
				</StyledTypography>
				{hint ? (
					<InfoOutlined
						fontSize="small"
						color="action"
						titleAccess={hint}
					/>
				) : (
					<></>
				)}
			</StyledInputLabel>
			{/* Keeping label empty to show labels on top */}
			<StyledMuiTextField
				id={componentId}
				sx={sx}
				{...props}
				label={""}
			/>
		</>
	);
};
