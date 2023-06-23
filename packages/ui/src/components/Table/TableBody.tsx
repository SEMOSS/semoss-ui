import React, { ReactNode } from "react";
import MuiTableBody from "@mui/material/TableBody";
import { SxProps } from "@mui/system";

export interface TableBodyProps {
    /** children to be rendered */
    children?: ReactNode;
    component?: React.ReactElement<any, any>;
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
