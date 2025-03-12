import { useEffect, useState } from 'react';
import {
    Button,
    TextField,
    Table,
    IconButton,
    Select,
    MenuItem,
    styled,
    Paper,
} from '@semoss/ui';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const StyledContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
}));

const StyledTableHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: theme.spacing(2),
}));

const StyledColumn = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledSelectMinWidth = styled(Select)(() => ({
    minWidth: '220px',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: `${theme.spacing(1)} 0`,
    borderRadius: theme.spacing(1),
    borderColor: '#BDBDBD',
    borderStyle: 'solid',
    borderCollapse: 'initial',
    borderWidth: 'thin',
    width: '100%',
}));

export const BuildDatabase = ({ onChange = (_) => {}, value = null }) => {
    const [tables, setTables] = useState([]);

    console.log({ value });

    useEffect(() => {
        onChange(tables);
    }, [tables]);

    const addTable = () => {
        setTables([
            ...tables,
            { name: `Table_${tables.length + 1}`, columns: [] },
        ]);
    };

    const updateTableName = (index, newName) => {
        const newTables = [...tables];
        newTables[index].name = newName;
        setTables(newTables);
    };

    const deleteTable = (tableIndex) => {
        const newTables = [...tables];
        newTables.splice(tableIndex, 1);
        setTables(newTables);
    };

    const addColumn = (tableIndex) => {
        const newTables = [...tables];
        newTables[tableIndex].columns.push({
            name: `Column_${newTables[tableIndex].columns.length + 1}`,
            type: 'string',
        });
        setTables(newTables);
    };

    const updateColumn = (tableIndex, columnIndex, columnName, columnType) => {
        const newTables = [...tables];
        newTables[tableIndex].columns[columnIndex] = {
            name: columnName,
            type: columnType,
        };
        setTables(newTables);
    };

    const deleteColumn = (tableIndex, columnIndex) => {
        const newTables = [...tables];
        newTables[tableIndex].columns.splice(columnIndex, 1);
        setTables(newTables);
    };

    return (
        <div>
            <StyledColumn>
                {tables.map((table, tableIndex) => (
                    <StyledPaper elevation={2} key={tableIndex + table.name}>
                        <StyledTableHeader>
                            <TextField
                                label="Table Name"
                                value={table.name}
                                onChange={(e) =>
                                    updateTableName(tableIndex, e.target.value)
                                }
                            />
                            <IconButton onClick={() => deleteTable(tableIndex)}>
                                <DeleteIcon />
                            </IconButton>
                        </StyledTableHeader>
                        <TableEditor
                            table={table}
                            tableIndex={tableIndex}
                            addColumn={addColumn}
                            updateColumn={updateColumn}
                            deleteColumn={deleteColumn}
                        />
                    </StyledPaper>
                ))}
            </StyledColumn>
            <Button
                variant="contained"
                onClick={addTable}
                startIcon={<AddIcon />}
            >
                Add Table
            </Button>
        </div>
    );
};

const TableEditor = ({
    table,
    tableIndex,
    addColumn,
    updateColumn,
    deleteColumn,
}) => (
    <div>
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.Cell>Column Name</Table.Cell>
                    <Table.Cell>Data Type</Table.Cell>
                    <Table.Cell>Actions</Table.Cell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {table.columns.map((column, columnIndex) => (
                    <Table.Row key={columnIndex}>
                        <Table.Cell>
                            <TextField
                                value={column.name}
                                onChange={(e) =>
                                    updateColumn(
                                        tableIndex,
                                        columnIndex,
                                        e.target.value,
                                        column.type,
                                    )
                                }
                            />
                        </Table.Cell>
                        <Table.Cell>
                            <StyledSelectMinWidth
                                value={column.type}
                                onChange={(e) =>
                                    updateColumn(
                                        tableIndex,
                                        columnIndex,
                                        column.name,
                                        e.target.value,
                                    )
                                }
                            >
                                <MenuItem value="STRING">String</MenuItem>
                                <MenuItem value="NUMBER">Number</MenuItem>
                                <MenuItem value="BOOLEAN">Boolean</MenuItem>
                                <MenuItem value="TIMESTAMP">TIMESTAMP</MenuItem>
                            </StyledSelectMinWidth>
                        </Table.Cell>
                        <Table.Cell>
                            <IconButton
                                onClick={() =>
                                    deleteColumn(tableIndex, columnIndex)
                                }
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
        <IconButton onClick={() => addColumn(tableIndex)} color="primary">
            <AddIcon />
        </IconButton>
    </div>
);
