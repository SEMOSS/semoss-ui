import { ReactNode } from "react";
import {
    LinearProgress,
    TableHead as MuiTableHead,
    SxProps,
} from "@mui/material";
import { TableCell } from "./TableCell";
import { TableRow } from "./TableRow";

export interface TableHeadProps {
    /** children to be rendered */
    children?: ReactNode;

    /**
     * Set loading state
     */
    loading?: boolean;

    /** custom style object */
    sx?: SxProps;
}

export const TableHead = (props: TableHeadProps) => {
    let muiTableHeadProps = { ...props };
    if (muiTableHeadProps?.loading) {
        delete muiTableHeadProps.loading;
    }

    return (
        <MuiTableHead {...muiTableHeadProps}>
            {props.children}
            {props?.loading ? (
                <tr>
                    <td colSpan={100}>
                        <LinearProgress color="inherit" />
                    </td>
                </tr>
            ) : (
                <></>
            )}
        </MuiTableHead>
    );
};
