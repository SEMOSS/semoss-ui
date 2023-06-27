import React, { ReactNode } from "react";
import MuiTableRow from "@mui/material/TableRow";
import { SxProps } from "@mui/system";

export interface TableRowProps {
    /** children to be rendered */
    children?: ReactNode;
    hover?: boolean;
    selected?: boolean;
    component?: React.ReactElement<any, any>;
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
