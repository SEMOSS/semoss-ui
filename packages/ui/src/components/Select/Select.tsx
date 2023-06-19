import MuiSelect from "@mui/material/Select";
import { SxProps } from "@mui/system";
import { SelectProps as MuiSelectProps } from "@mui/material";

export interface SelectProps extends MuiSelectProps {
    /** custom style object */
    sx?: SxProps;
}

export const Select = (props: SelectProps) => {
    const { sx } = props;
    return <MuiSelect sx={sx} {...props} />;
};
