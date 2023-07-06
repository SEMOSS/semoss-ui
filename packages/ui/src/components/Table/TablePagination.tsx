import { SxProps } from "@mui/system";
import { TablePagination as MuiTablePagination } from "@mui/material";

export interface TablePaginationProps {
    /**
     * The total number of rows.
     *
     * To enable server side pagination for an unknown number of items, provide -1.
     */
    count: number;
    /**
     * The zero-based index of the current page.
     */
    page: number;
    /**
     * The number of rows per page.
     *
     * Set -1 to display all the rows.
     */
    rowsPerPage: number;
    /**
     * Customizes the options of the rows per page select field. If less than two options are
     * available, no select field will be displayed.
     * Use -1 for the value with a custom label to show all the rows.
     * @default [10, 25, 50, 100]
     */
    rowsPerPageOptions?: Array<number | { value: number; label: string }>;
    /**
     * Callback fired when the page is changed.
     *
     * @param {React.MouseEvent<HTMLButtonElement> | null} event The event source of the callback.
     * @param {number} page The page selected.
     */
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement> | null,
        page: number,
    ) => void;
    /**
     * Callback fired when the number of rows per page is changed.
     *
     * @param {React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>} event The event source of the callback.
     */
    onRowsPerPageChange?: React.ChangeEventHandler<
        HTMLTextAreaElement | HTMLInputElement
    >;

    /** custom style object */
    sx?: SxProps;
}

export const TablePagination = (props: TablePaginationProps) => {
    const { sx } = props;
    return <MuiTablePagination sx={sx} {...props}></MuiTablePagination>;
};
