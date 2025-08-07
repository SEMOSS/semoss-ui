import {
    InputBaseComponentProps,
	TextField as MuiTextField,
	type TextFieldProps as MuiTextFieldProps,
	type SxProps,
} from "@mui/material";
import { useEffect, useState } from "react";

export type TextFieldProps = MuiTextFieldProps & {
	/** custom style object */
	sx?: SxProps;
};

export const TextField = (props: TextFieldProps) => {
	const { sx, inputProps } = props;
	const [componentId, setComponentId] = useState(props.id);

	useEffect(() => {
		if (!componentId) {
			// gets rid of suggestions
			setComponentId(`generated-id-${Date.now()}`);
		}
	}, [componentId]);

	return (
        <MuiTextField
            id={componentId}
            sx={sx}
            {...props}
            inputProps={{ ...inputProps, spellCheck: true }}
        />
    );
};
