import { ReactNode } from "react";
import MuiTable from "@mui/material/Table";
import { SxProps } from "@mui/system";
import { TableProps as MuiTableProps } from "@mui/material";

export interface TableProps {
    /** children to be rendered */
    children: ReactNode;
    padding?: "checkbox" | "none" | "normal";
    size?: "medium" | "small";
    component?: React.ReactElement<any, any>;
    /** custom style object */
    sx?: SxProps;
}

export const Table = (props: TableProps) => {
    const { children, sx } = props;
    return (
        <MuiTable sx={sx} {...props}>
            {children}
        </MuiTable>
    );
};
