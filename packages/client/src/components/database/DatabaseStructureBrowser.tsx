import React from 'react';
import {
    Button,
    styled,
    Stack,
    Typography,
    TextField,
    IconButton,
    Box,
} from '@semoss/ui';
import {
    Search,
    Refresh,
    Storage,
    ExpandMore,
    ChevronRight,
} from '@mui/icons-material';
import { DatabaseColumnIcon } from './DatabaseColumnIcon';

const StyledSearchSection = styled('div')(({ theme }) => ({
    padding: `${theme.spacing(1)} 20px`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
}));

const StyledTablesList = styled('div')(() => ({
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
}));

const StyledTable = styled('table')(({ theme }) => ({
    width: '100%',
    borderCollapse: 'collapse',
    outline: 'none',
    padding: theme.spacing(1),
    '& th': {
        borderColor: theme.palette.grey[300],
        borderBottom: 'none',
        backgroundColor: theme.palette.grey[100],
    },
    '& td': {
        borderColor: theme.palette.grey[300],
    },
    '& th:not(:last-child), td:not(:last-child)': {
        borderRight: 'none',
    },
    '& tr:not(:last-child) > td': {
        borderBottom: 'none',
    },
}));

const StyledTableHeaderRow = styled('tr')(({ theme }) => ({
    cursor: 'pointer',
    outline: 'none',
    '&:hover': {
        backgroundColor: theme.palette.grey[100],
    },
    '&.closed': {
        '& th:first-of-type': {
            borderBottomLeftRadius: theme.shape.borderRadius,
        },
        '& th:last-child': {
            borderBottomRightRadius: theme.shape.borderRadius,
        },
        '& th': {
            borderBottom: `1px solid ${theme.palette.grey[300]}`,
        },
    },
}));

const StyledTableHeaderCell = styled('th')(({ theme }) => ({
    padding: theme.spacing(1.5),
    textAlign: 'left',
    fontWeight: 600,
    '&.col-4': {
        width: '20%',
    },
}));

const StyledColumnRow = styled('tr')(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.grey[50],
    },
}));

const StyledTableCell = styled('td')(({ theme }) => ({
    padding: theme.spacing(1.5),
    '&.col-4': {
        width: '20%',
    },
}));

interface Column {
    column: string;
    type: string;
}

interface Table {
    table: string;
    columns: Column[];
}

interface DatabaseStructureBrowserProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchedStructure: Table[];
    expandedTables: Record<string, boolean>;
    toggleState: boolean;
    toggleTable: (tableName: string) => void;
    toggleAllTables: () => void;
    isLoading: boolean;
    error: string | null;
    refreshDatabaseStructure: () => void;
    refreshMessage: string | null;
}

export const DatabaseStructureBrowser: React.FC<DatabaseStructureBrowserProps> = ({
    searchTerm,
    setSearchTerm,
    searchedStructure,
    expandedTables,
    toggleState,
    toggleTable,
    toggleAllTables,
    isLoading,
    error,
    refreshDatabaseStructure,
    refreshMessage,
}) => {
    return (
        <>
            <StyledSearchSection>
                <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        Available Columns
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={refreshDatabaseStructure}
                        title="Refresh database structure"
                        disabled={isLoading}
                    >
                        <Refresh fontSize="small" />
                    </IconButton>
                </Stack>
               
                <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center', mb: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Search available columns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'secondary' }} />,
                        }}
                        sx={{ flex: 1 }}
                    />
                </Stack>
               
                <Button
                    variant="text"
                    size="small"
                    onClick={toggleAllTables}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                    {toggleState ? 'Collapse All' : 'Expand All'}
                </Button>
            </StyledSearchSection>

            <StyledTablesList>
                {refreshMessage && (
                    <Box sx={{ padding: 2, backgroundColor: 'info.light', mb: 1 }}>
                        <Typography variant="body2" color="info">
                            {refreshMessage}
                        </Typography>
                    </Box>
                )}
                
                {isLoading && (
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body2" color="secondary">
                            Loading database structure...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    </Box>
                )}

                {searchedStructure.map((table: Table) => (
                    <div key={table.table} style={{ padding: '8px' }}>
                        <StyledTable>
                            <thead>
                                <StyledTableHeaderRow
                                    onClick={() => toggleTable(table.table)}
                                    title={table.table}
                                    className={!expandedTables[table.table] ? 'closed' : ''}
                                >
                                    <StyledTableHeaderCell className="col-4" style={{ textAlign: 'center' }}>
                                        <Storage fontSize="small" sx={{ color: '#666666' }} />
                                    </StyledTableHeaderCell>
                                    <StyledTableHeaderCell>
                                        <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                            {table.table}
                                        </Typography>
                                    </StyledTableHeaderCell>
                                    <StyledTableHeaderCell className="col-4" style={{ textAlign: 'center' }}>
                                        {expandedTables[table.table] ? (
                                            <ExpandMore fontSize="small" />
                                        ) : (
                                            <ChevronRight fontSize="small" />
                                        )}
                                    </StyledTableHeaderCell>
                                </StyledTableHeaderRow>
                            </thead>

                            {expandedTables[table.table] && (
                                <tbody>
                                    {table.columns.map((column: Column, index: number) => (
                                        <StyledColumnRow
                                            key={index}
                                            title={`${column.column} (${column.type})`}
                                        >
                                            <StyledTableCell className="col-4" style={{ textAlign: 'center' }}>
                                                <DatabaseColumnIcon type={column.type} />
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                                    {column.column}
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell className="col-4">
                                            </StyledTableCell>
                                        </StyledColumnRow>
                                    ))}
                                </tbody>
                            )}
                        </StyledTable>
                    </div>
                ))}
            </StyledTablesList>
        </>
    );
};
