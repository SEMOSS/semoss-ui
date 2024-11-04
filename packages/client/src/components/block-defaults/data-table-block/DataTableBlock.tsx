// DataTableBlock.tsx
import {
    CSSProperties,
    useMemo,
    useState,
    useEffect,
    useCallback,
} from 'react';
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
import { useBlock, useBlocks } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

export interface DataTableBlockDef extends BlockDef<'table'> {
    widget: 'table';
    data: {
        style: CSSProperties;
        rawData: string;
        displayData: unknown[];
        headers: Array<{
            display: string;
            value: string;
            defaultValue?: unknown;
        }>;
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

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    margin: theme.spacing(1),
    maxHeight: '70vh',
    overflow: 'auto',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
}));

export const DataTableBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<DataTableBlockDef>(id);
    const { state } = useBlocks();
    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [isProcessing, setIsProcessing] = useState(false);

    // Effect to handle custom headers
    useEffect(() => {
        if (data.headers?.length > 0 && data.displayData?.length >= 0) {
            // Create a new array with existing data
            const updatedData =
                data.displayData.length > 0 ? [...data.displayData] : [{}];

            // For each header, ensure its value exists in the data
            data.headers.forEach((header) => {
                // If this is a custom header with a value
                if (header.defaultValue !== undefined) {
                    updatedData.forEach((row) => {
                        // Add or update the value in the row
                        row[header.value] = header.defaultValue;
                    });
                }
            });

            // Only update if there are actual changes
            if (
                JSON.stringify(updatedData) !== JSON.stringify(data.displayData)
            ) {
                setData('displayData', updatedData);
            }
        }
    }, [data.headers, setData]);

    // Get table headers
    const headers = useMemo(() => {
        if (data.headers && data.headers.length > 0) {
            return data.headers;
        }
        if (!data.displayData?.[0]) return [];
        return Object.keys(data.displayData[0]).map((key) => ({
            display:
                key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            value: key,
        }));
    }, [data.displayData, data.headers]);

    // Handle sorting
    const handleSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);

        const sortedData = [...data.displayData].sort((a, b) => {
            const valueA = a[property];
            const valueB = b[property];

            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });

        setData('displayData', sortedData);
    };

    // Handle row deletion
    const handleDeleteRow = (rowIndex: number) => {
        const newData = data.displayData.filter(
            (_, index) => index !== rowIndex,
        );
        setData('displayData', newData);
    };

    // Paginated data
    const paginatedData = useMemo(() => {
        if (!data.enablePagination) return data.displayData;
        const startIndex = page * data.rowsPerPage;
        return data.displayData.slice(
            startIndex,
            startIndex + data.rowsPerPage,
        );
    }, [data.displayData, page, data.rowsPerPage, data.enablePagination]);

    if (!data.displayData || isProcessing) {
        return <LinearProgress />;
    }

    // Update the condition for showing "No data" message
    const showNoDataMessage = useMemo(() => {
        return data.displayData.length === 0 || headers.length === 0;
    }, [data.displayData, data.headers]);

    // Update cell rendering
    const renderCell = useCallback(
        (row: unknown, header: { value: string; defaultValue?: any }) => {
            if (!row) return '';

            // First try to get value from row
            const value = row[header.value];

            // If value is undefined, use the default value from header
            return (
                (value !== undefined
                    ? value
                    : header.defaultValue
                )?.toString() || ''
            );
        },
        [],
    );

    return (
        <StyledTableContainer {...attrs}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        {headers.map((header) => (
                            <TableCell
                                key={header.value}
                                sx={{
                                    fontWeight: 700,
                                    backgroundColor: 'background.paper',
                                }}
                            >
                                {data.enableSorting ? (
                                    <TableSortLabel
                                        active={orderBy === header.value}
                                        direction={
                                            orderBy === header.value
                                                ? order
                                                : 'asc'
                                        }
                                        onClick={() => handleSort(header.value)}
                                    >
                                        {header.display}
                                    </TableSortLabel>
                                ) : (
                                    header.display
                                )}
                            </TableCell>
                        ))}
                        {data.enableActions && (
                            <TableCell
                                align="right"
                                sx={{ backgroundColor: 'background.paper' }}
                            >
                                Actions
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {!showNoDataMessage ? (
                        (paginatedData?.length > 0 ? paginatedData : [{}]).map(
                            (row, rowIndex) => (
                                <StyledTableRow key={rowIndex}>
                                    {headers.map((header) => (
                                        <TableCell
                                            key={`${rowIndex}-${header.value}`}
                                        >
                                            {renderCell(row, header)}
                                        </TableCell>
                                    ))}
                                    {data.enableActions && (
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleDeleteRow(rowIndex)
                                                }
                                            >
                                                <DeleteOutline />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </StyledTableRow>
                            ),
                        )
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={
                                    headers.length +
                                    (data.enableActions ? 1 : 0)
                                }
                                align="center"
                            >
                                <em>
                                    {data.noDataText || 'No data available'}
                                </em>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {data.enablePagination && data.displayData.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    component="div"
                    count={data.displayData.length}
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
