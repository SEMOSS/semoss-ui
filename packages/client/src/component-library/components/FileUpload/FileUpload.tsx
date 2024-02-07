import { Input as MuiInput, SxProps } from '@mui/material';

export interface InputProps {
    /** custom style object */
    sx?: SxProps;
}

export const Input = (props: InputProps) => {
    const { sx } = props;
    return (
        <MuiInput type="file" disableUnderline sx={sx} {...props}></MuiInput>
    );
};
