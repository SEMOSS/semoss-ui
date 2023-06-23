import React, { ReactNode } from "react";
import MuiTableCell, {
    TableCellBaseProps as MuiTableCellProps,
} from "@mui/material/TableCell";
import { SxProps } from "@mui/system";

export interface TableCellProps {
    /** children to be rendered */
    children?: ReactNode;
    align?: "center" | "inherit" | "justify" | "left" | "right";
    padding?: "checkbox" | "none" | "normal";
    component?: React.ElementType<MuiTableCellProps>;
    size?: "medium" | "small";
    scope?: string;
    sortDirection?: "asc" | "desc" | false;
    variant?: "body" | "footer" | "head";
    colSpan?: number;
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
