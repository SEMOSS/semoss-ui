import { Table as BaseTable, TableProps } from './Table';
import { TableBody, TableBodyProps } from './TableBody';
import { TableCell, TableCellProps } from './TableCell';
import { TableContainer, TableContainerProps } from './TableContainer';
import { TableFooter, TableFooterProps } from './TableFooter';
import { TableHead, TableHeadProps } from './TableHead';
import { TablePagination, TablePaginationProps } from './TablePagination';
import { TableRow, TableRowProps } from './TableRow';

const TableNameSpace = Object.assign(BaseTable, {
    Body: TableBody,
    Cell: TableCell,
    Container: TableContainer,
    Footer: TableFooter,
    Head: TableHead,
    Pagination: TablePagination,
    Row: TableRow,
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
};

export { TableNameSpace as Table };
