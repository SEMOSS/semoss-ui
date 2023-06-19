import { ReactNode } from "react";
import MuiTableCell from "@mui/material/TableCell";
import { SxProps } from "@mui/system";
import { TableCellProps as MuiTableCellProps } from "@mui/material";

export interface TableCellProps extends MuiTableCellProps {
    /** children to be rendered */
    children: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const TableCell = (props: TableCellProps) => {
    const { children, sx } = props;
    return (
        <MuiTableCell sx={sx} {...props}>
            {children}
        </MuiTableCell>
    );
};
