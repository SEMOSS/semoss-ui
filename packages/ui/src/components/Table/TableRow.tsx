import { ReactNode } from "react";
import MuiTableRow from "@mui/material/TableRow";
import { SxProps } from "@mui/system";
import { TableRowProps as MuiTableRowProps } from "@mui/material";

export interface TableRowProps extends MuiTableRowProps {
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
