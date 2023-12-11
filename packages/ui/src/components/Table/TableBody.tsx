import { ReactNode } from "react";
import { styled, TableBody as MuiTableBody, SxProps } from "@mui/material";
import { TableCell } from "./TableCell";
import { TableRow } from "./TableRow";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    padding: theme.spacing(2),
}));

export interface TableBodyProps {
    /** children to be rendered */
    /**
     * The content of the component, normally `TableRow`.
     */
    children?: ReactNode;

    /**
     * Message to display when table has no data
     */
    noDataText?: string;

    /** custom style object */
    sx?: SxProps;
}

export const TableBody = (props: TableBodyProps) => {
    const { children, sx } = props;
    return (
        <MuiTableBody sx={sx} {...props}>
            {children ?? (
                <StyledTableRow>
                    <TableCell colSpan={100}>
                        <em>{props?.noDataText ?? "No data available"}</em>
                    </TableCell>
                </StyledTableRow>
            )}
        </MuiTableBody>
    );
};
