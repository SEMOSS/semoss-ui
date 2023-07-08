import { ReactNode } from "react";
import MuiTable from "@mui/material/Table";
import { SxProps } from "@mui/system";

export interface TableProps {
    /** children to be rendered */
    children: ReactNode;

    /**
     * Set the header sticky.
     *
     * ⚠️ It doesn't work with IE11.
     * @default false
     */
    stickyHeader?: boolean;
    /** custom style object */
    /**
     * Allows TableCells to inherit size of the Table.
     * @default 'medium'
     */
    size?: "small" | "medium";
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
