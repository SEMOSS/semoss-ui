import { TextField as MuiTextfield, SxProps } from '@mui/material';

import {
    TextFieldProps as MuiTextFieldProps,
    InputProps as MuiInputProps,
} from '@mui/material';

export type TextAreaProps = MuiInputProps &
    MuiTextFieldProps & {
        /** custom style object */
        sx?: SxProps;

        /** amount of rows to render */
        rows?: number;

        /** min number of rows that can be rendered */
        minRows?: number;

        /** maxiumum number of rows that can be rendered */
        maxRows?: number;

        /** text to display on input */
        label?: string | number;

        /** placeholder text displayed within textarea */
        placeholder?: string | number;
    };

export const TextArea = (props: TextAreaProps) => {
    const {
        rows,
        minRows,
        maxRows,
        label,
        multiline = true,
        placeholder,
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
        />
    );
};
