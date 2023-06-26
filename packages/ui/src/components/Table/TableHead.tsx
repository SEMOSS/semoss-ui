import { ReactNode } from "react";
import MuiTableHead from "@mui/material/TableHead";
import { SxProps } from "@mui/system";
import { TableHeadProps as MuiTableHeadProps } from "@mui/material";

export interface TableHeadProps extends MuiTableHeadProps {
    /** children to be rendered */
<<<<<<< HEAD
    children?: ReactNode;
=======
    children: ReactNode;
>>>>>>> 050de80 (added typed props)

    /** custom style object */
    sx?: SxProps;
}

export const TableHead = (props: TableHeadProps) => {
    const { children, sx } = props;
    return (
        <MuiTableHead sx={sx} {...props}>
            {children}
        </MuiTableHead>
    );
};
