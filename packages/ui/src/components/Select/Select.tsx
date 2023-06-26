import { ReactNode } from "react";
import MuiSelect from "@mui/material/Select";
import { SxProps } from "@mui/system";
import { SelectProps as MuiSelectProps } from "@mui/material";

export interface SelectProps extends MuiSelectProps {
    /** custom style object */
    onChange: (event: any) => void;
    value: "" | any;
    children?: ReactNode;
    defaultValue?: any;
    onClose?: () => void;
    open?: boolean;
    variant?: "filled" | "outlined" | "standard";
    sx?: SxProps;
}

export const Select = (props: SelectProps) => {
    const { sx } = props;
    return <MuiSelect sx={sx} {...props} />;
};
