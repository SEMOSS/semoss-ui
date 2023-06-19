import { ReactNode } from "react";
import MuiPagination from "@mui/material/Pagination";
import { SxProps } from "@mui/system";
import { PaginationProps as MuiPaginationProps } from "@mui/material";

export interface PaginationProps extends MuiPaginationProps {
    /** custom style object */
    sx?: SxProps;
}

export const Pagination = (props: PaginationProps) => {
    const { sx } = props;
    return <MuiPagination sx={sx} {...props} />;
};
