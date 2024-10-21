import { ReactNode } from "react";
import { TableBody as MuiTableBody, SxProps } from "@mui/material";

export interface TableBodyProps {
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
