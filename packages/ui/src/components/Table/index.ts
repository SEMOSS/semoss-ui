import { Table as BaseTable, TableProps } from "./Table";
import { TableBody, TableBodyProps } from "./TableBody";
import { TableCell, TableCellProps } from "./TableCell";
import { TableContainer, TableContainerProps } from "./TableContainer";
import { TableHead, TableHeadProps } from "./TableHead";
import { TableRow, TableRowProps } from "./TableRow";

const TableNameSpace = Object.assign(BaseTable, {
    Body: TableBody,
    Cell: TableCell,
    Container: TableContainer,
    Head: TableHead,
    Row: TableRow,
});

export type {
    TableProps,
    TableBodyProps,
    TableCellProps,
    TableContainerProps,
    TableHeadProps,
};

export { TableNameSpace as Table };
