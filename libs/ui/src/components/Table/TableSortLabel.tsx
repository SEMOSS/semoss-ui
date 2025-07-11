import { ReactNode } from "react";
import {
    TableSortLabel as MuiTableSort,
    TableSortLabelProps,
    SxProps,
} from "@mui/material";

export type TableSortProps = TableSortLabelProps & {
    /** children to be rendered */
    children?: ReactNode;
    /** custom style object */
    sx?: SxProps;
};

export const TableSortLabel = (props: TableSortProps) => {
    const { children, sx } = props;
    return (
        <MuiTableSort sx={sx} {...props}>
            {children}
        </MuiTableSort>
    );
};
