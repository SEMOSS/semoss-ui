import { CSSProperties, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
} from '@mui/material';

export interface TableBlockDef extends BlockDef<'table'> {
    widget: 'table';
    data: {
        style: CSSProperties;
        content: Array<object> | string;
        headers: Array<{ display: string; value: string }>;
    };
}

export const TableBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<TableBlockDef>(id);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const content = useMemo(() => {
        if (!data?.content) {
            return [];
        }

        if (typeof data?.content === 'string') {
            // try to parse as an array, if not return empty array
            try {
                const jsonSafeString = data.content.replace(/'/g, '"');
                if (Array.isArray(JSON.parse(jsonSafeString))) {
                    return JSON.parse(jsonSafeString);
                }
            } catch (e) {
                return [];
            }
        }

        return data.content;
    }, [data?.content]);

    const headerDisplay = useMemo(() => {
        if (!data?.headers || data?.headers?.length === 0) {
            return content?.length ? Object.keys(content[0]) : [];
        }

        return data.headers.map((header) => header.display);
    }, [data?.headers, data?.content]);

    const headerValues = useMemo(() => {
        if (!data?.headers || data?.headers?.length === 0) {
            return content?.length ? Object.keys(content[0]) : [];
        }

        return data.headers.map((header) => header.value);
    }, [data?.headers, data?.content]);

    return (
        <div style={{ overflow: 'scroll', ...data.style }} {...attrs}>
            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {Array.from(headerDisplay, (header) => {
                                return (
                                    <TableCell
                                        sx={{ textTransform: 'capitalize' }}
                                        key={header}
                                    >
                                        {header.replaceAll('_', ' ')}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.from(
                            content.slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage,
                            ),
                            (row, i) => {
                                return (
                                    <TableRow key={i}>
                                        {Array.from(
                                            headerValues,
                                            (headerValue, j) => {
                                                return (
                                                    <TableCell
                                                        key={`${i}-${j}`}
                                                    >
                                                        {row[
                                                            headerValue
                                                        ].toString() ?? ''}
                                                    </TableCell>
                                                );
                                            },
                                        )}
                                    </TableRow>
                                );
                            },
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={content.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setPage(0);
                }}
            />
        </div>
    );
});
