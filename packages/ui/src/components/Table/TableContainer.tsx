import { ReactNode } from "react";
import MuiTableContainer from "@mui/material/TableContainer";
import { SxProps } from "@mui/system";
import { TableContainerProps as MuiTableContainerProps } from "@mui/material";

export interface TableContainerProps extends MuiTableContainerProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const TableContainer = (props: TableContainerProps) => {
    const { children, sx } = props;
    return (
        <MuiTableContainer sx={sx} {...props}>
            {children}
        </MuiTableContainer>
    );
};
