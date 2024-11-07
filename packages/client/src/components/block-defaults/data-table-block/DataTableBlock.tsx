// DataTableBlock.tsx
import { CSSProperties, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    IconButton,
    styled,
    LinearProgress,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

export interface DataTableBlockDef extends BlockDef<'table'> {
    widget: 'table';
    data: {
        style: CSSProperties;
        rawData: string;
        displayData: unknown[];
        headers: Array<{ display: string; value: string }>;
        enablePagination: boolean;
        rowsPerPage: number;
        enableSorting: boolean;
        enableActions: boolean;
        noDataText?: string;
        loading?: boolean;
        fileType?: 'json' | 'csv';
        dataSource?: 'query' | 'file';
    };
    listeners: {
        onChange: true;
    };
}

const StyledTableContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '50vh',
    overflow: 'hidden',
    margin: theme.spacing(1),
}));

const ScrollableTableContainer = styled(TableContainer)({
    flex: 1,
    overflow: 'auto',
});

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    maxWidth: '350px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    padding: theme.spacing(2),
}));

export const DataTableBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<DataTableBlockDef>(id);
    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    // Get table content
    const content = useMemo(() => {
        if (
            data.dataSource === 'query' &&
            Array.isArray(data.rawData) &&
            data.rawData.length > 0 &&
            !data.displayData?.length
        ) {
            setData('displayData', data.rawData);
            return data.rawData;
        }

        // Otherwise use displayData if available
        if (data.displayData?.length) {
            return data.displayData;
        }

        // If we have headers but no data, create a single empty row
        if (data.headers?.length) {
            return [
                data.headers.reduce((obj, header) => {
                    obj[header.value] = header.value;
                    return obj;
                }, {}),
            ];
        }

        return [];
    }, [data.dataSource, data.rawData, data.displayData, data.headers]);

    // Get table headers
    const headerDisplay = useMemo(() => {
        if (data.headers?.length) {
            return data.headers.map((header) => header.display);
        }

        if (content?.length) {
            return Object.keys(content[0]).map(
                (key) =>
                    key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/_/g, ' '),
            );
        }

        return [];
    }, [data.headers, content]);

    // Get header values
    const headerValues = useMemo(() => {
        if (data.headers?.length) {
            return data.headers.map((header) => header.value);
        }

        return content?.length ? Object.keys(content[0]) : [];
    }, [data.headers, content]);

    // Handle sorting
    const handleSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);

        const sortedData = [...content].sort((a, b) => {
            const valueA = a[property];
            const valueB = b[property];

            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });

        setData('displayData', sortedData);
    };

    // Paginated data
    const paginatedData = useMemo(() => {
        const dataToUse = Array.isArray(content) ? content : [];
        if (!data.enablePagination) return dataToUse;
        const startIndex = page * data.rowsPerPage;
        return dataToUse.slice(startIndex, startIndex + data.rowsPerPage);
    }, [content, page, data.rowsPerPage, data.enablePagination]);

    if (!data.displayData) {
        return <LinearProgress />;
    }

    return (
        <StyledTableContainer {...attrs}>
            <ScrollableTableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {headerDisplay.map((header, index) => (
                                <StyledTableCell
                                    key={header}
                                    sx={{
                                        fontWeight: 700,
                                        backgroundColor: 'background.paper',
                                        textTransform: data?.headers?.length
                                            ? 'none'
                                            : 'capitalize',
                                    }}
                                >
                                    {data.enableSorting ? (
                                        <TableSortLabel
                                            active={
                                                orderBy === headerValues[index]
                                            }
                                            direction={
                                                orderBy === headerValues[index]
                                                    ? order
                                                    : 'asc'
                                            }
                                            onClick={() =>
                                                handleSort(headerValues[index])
                                            }
                                        >
                                            {header}
                                        </TableSortLabel>
                                    ) : (
                                        header
                                    )}
                                </StyledTableCell>
                            ))}
                            {data.enableActions && (
                                <StyledTableCell
                                    align="right"
                                    sx={{ backgroundColor: 'background.paper' }}
                                >
                                    Actions
                                </StyledTableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {content && content?.length ? (
                            Array.isArray(paginatedData) &&
                            paginatedData.map((row, rowIndex) => (
                                <StyledTableRow key={rowIndex}>
                                    {headerValues.map(
                                        (headerValue, colIndex) => (
                                            <StyledTableCell
                                                key={`${rowIndex}-${colIndex}`}
                                            >
                                                {row[headerValue]?.toString() ||
                                                    ''}
                                            </StyledTableCell>
                                        ),
                                    )}
                                    {data.enableActions && (
                                        <StyledTableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const newData =
                                                        content.filter(
                                                            (_, index) =>
                                                                index !==
                                                                rowIndex,
                                                        );
                                                    setData(
                                                        'displayData',
                                                        newData,
                                                    );
                                                }}
                                            >
                                                <DeleteOutline />
                                            </IconButton>
                                        </StyledTableCell>
                                    )}
                                </StyledTableRow>
                            ))
                        ) : (
                            <TableRow>
                                <StyledTableCell
                                    colSpan={
                                        headerDisplay.length +
                                        (data.enableActions ? 1 : 0)
                                    }
                                    align="center"
                                >
                                    <em>
                                        {data.noDataText || 'No data available'}
                                    </em>
                                </StyledTableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollableTableContainer>
            {data.enablePagination && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    component="div"
                    count={content.length}
                    rowsPerPage={data.rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setData('rowsPerPage', parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            )}
        </StyledTableContainer>
    );
});
