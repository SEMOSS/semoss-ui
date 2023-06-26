import { ReactNode } from "react";
import MuiTableBody from "@mui/material/TableBody";
import { SxProps } from "@mui/system";
import { TableBodyProps as MuiTableBodyProps } from "@mui/material";

export interface TableBodyProps extends MuiTableBodyProps {
    /** children to be rendered */
    /**
     * The content of the component, normally `TableRow`.
     */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const TableBody = (props: TableBodyProps) => {
    const { children, sx } = props;
    return (
        <MuiTableBody sx={sx} {...props}>
            {children}
        </MuiTableBody>
    );
};
