import { ReactNode } from "react";
import MuiTableHead from "@mui/material/TableHead";
import { SxProps } from "@mui/system";

export interface TableHeadProps {
    /** children to be rendered */
    children?: ReactNode;
    /** custom style object */
    sx?: SxProps;
}

export const TableHead = (props: TableHeadProps) => {
    const { children, sx } = props;
    return (
        <MuiTableHead sx={sx} {...props}>
            {children}
        </MuiTableHead>
    );
};
