import { ReactNode } from "react";
import { TableRow as MuiTableRow, SxProps } from "@mui/material";

export interface TableRowProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const TableRow = (props: TableRowProps) => {
    const { children, sx } = props;
    return (
        <MuiTableRow sx={sx} {...props}>
            {children}
        </MuiTableRow>
    );
};
