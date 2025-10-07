import { tableCellClasses } from "@mui/material";
import { Table as BaseTable, type TableProps } from "./Table";
import { TableBody, type TableBodyProps } from "./TableBody";
import { TableCell, type TableCellProps } from "./TableCell";
import { TableContainer, type TableContainerProps } from "./TableContainer";
import { TableFooter, type TableFooterProps } from "./TableFooter";
import { TableHead, type TableHeadProps } from "./TableHead";
import { TablePagination, type TablePaginationProps } from "./TablePagination";
import { TableRow, type TableRowProps } from "./TableRow";
import { TableSortLabel, type TableSortProps } from "./TableSortLabel";

const TableNameSpace = Object.assign(BaseTable, {
	Body: TableBody,
	Cell: TableCell,
	Container: TableContainer,
	Footer: TableFooter,
	Head: TableHead,
	Pagination: TablePagination,
	Row: TableRow,
	Sort: TableSortLabel,
});

export type {
	TableProps,
	TableBodyProps,
	TableCellProps,
	TableContainerProps,
	TableFooterProps,
	TableHeadProps,
	TablePaginationProps,
	TableRowProps,
	TableSortProps,
};

export { tableCellClasses };

export { TableNameSpace as Table };
