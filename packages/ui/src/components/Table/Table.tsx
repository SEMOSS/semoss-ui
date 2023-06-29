import { ReactNode } from "react";
import MuiTable from "@mui/material/Table";
import { SxProps } from "@mui/system";
import { TableProps as MuiTableProps } from "@mui/material";

export interface TableProps {
    /** children to be rendered */
    children: ReactNode;

    padding?: "checkbox" | "none" | "normal";

    /**
     * Allows TableCells to inherit size of the Table.
     * @default 'medium'
     */
    size?: "medium" | "small";

    component?: React.ReactElement<any, any>;

    /**
     * Set the header sticky.
     *
     * ⚠️ It doesn't work with IE11.
     * @default false
     */
    stickyHeader?: boolean;
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
