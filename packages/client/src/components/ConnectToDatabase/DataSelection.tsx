import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Tabs,
    Tab,
    MenuItem,
    IconButton,
    Box,
} from '@mui/material';
import { TextField } from '@semoss/ui';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

interface ImportFileProps {
    files: {
        headers: string[];
        dataTypes: Record<string, string>;
        cleanHeaders: string[];
    };
    onImport: () => void;
    onCancel: () => void;
}

const DataSelection: React.FC<ImportFileProps> = ({
    files,
    onImport,
    onCancel,
}) => {
    const [editableFields, setEditableFields] = useState<{
        [key: number]: string;
    }>({});
    const [rowEditableState, setRowEditableState] = useState<{
        [key: number]: boolean;
    }>(
        Object.fromEntries(files.cleanHeaders.map((_, index) => [index, true])), // Initially all rows are editable
    );
    const [openModal, setOpenModal] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [editAlias, setEditAlias] = useState('');
    const [selectedDataType, setSelectedDataType] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('');
    const [description, setDescription] = useState('');
    const [logicalName, setLogicalName] = useState('');

    // Handle name change in the input fields
    const handleNameChange = (index: number, newValue: string) => {
        setEditableFields((prev) => ({
            ...prev,
            [index]: newValue,
        }));
    };

    // Toggle row editability and change the icon
    const toggleRowEditState = (index: number) => {
        setRowEditableState((prev) => ({
            ...prev,
            [index]: !prev[index], // Toggle the edit state
        }));
    };

    // Open the modal for column editing
    const handleOpenModal = (column: string) => {
        setSelectedColumn(column);
        setEditAlias(column); // Pre-fill alias
        setSelectedDataType(files.dataTypes[column] || 'Unknown');
        setOpenModal(true);
    };

    return (
        <div>
            <h3>Data Selection</h3>
            <TableContainer sx={{ maxHeight: '400px', overflow: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell
                                sx={{
                                    width: '80%',
                                    fontWeight: 'bold',
                                    border: '1px solid lightgray',
                                }}
                            >
                                Name
                            </TableCell>
                            <TableCell
                                sx={{
                                    width: '15%',
                                    fontWeight: 'bold',
                                    border: '1px solid lightgray',
                                }}
                            >
                                Data Type
                            </TableCell>
                            <TableCell
                                sx={{
                                    width: '5%',
                                    fontWeight: 'bold',
                                    border: '1px solid lightgray',
                                }}
                            ></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {files.cleanHeaders.map((column, index) => (
                            <TableRow
                                key={index}
                                sx={{
                                    backgroundColor: rowEditableState[index]
                                        ? 'inherit'
                                        : '#e0e0e0', // Grey when readonly
                                }}
                            >
                                <TableCell
                                    sx={{
                                        width: '80%',
                                        border: '1px solid lightgray',
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        value={editableFields[index] ?? column}
                                        onChange={(e) =>
                                            handleNameChange(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        variant="outlined"
                                        size="small"
                                        disabled={!rowEditableState[index]} // Disable when readonly
                                    />
                                </TableCell>
                                <TableCell
                                    sx={{
                                        width: '15%',
                                        border: '1px solid lightgray',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span>
                                            {files.dataTypes[column] ||
                                                'Unknown'}
                                        </span>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleOpenModal(column)
                                            }
                                            disabled={!rowEditableState[index]}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </div>
                                </TableCell>
                                <TableCell
                                    sx={{
                                        width: '5%',
                                        border: '1px solid lightgray',
                                    }}
                                >
                                    <IconButton
                                        onClick={() =>
                                            toggleRowEditState(index)
                                        }
                                    >
                                        {rowEditableState[index] ? (
                                            <CloseIcon color="error" /> // 🔴 Remove Icon (Close)
                                        ) : (
                                            <AddIcon color="success" /> // 🟢 Add Icon (Re-enable)
                                        )}
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                }}
            >
                <Button variant="outlined" color="primary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={onImport}>
                    Import
                </Button>
            </div>

            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                fullWidth
                maxWidth="sm"
                sx={{
                    '& .MuiDialog-paper': { width: '750px', height: '750px' },
                }}
            >
                <DialogTitle>Edit id: {selectedColumn}</DialogTitle>
                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                    }}
                >
                    <Tabs
                        value={tabIndex}
                        onChange={(_, newValue) => setTabIndex(newValue)}
                        sx={{ alignSelf: 'flex-start', fontSize: '15px' }}
                    >
                        <Tab
                            label="Settings"
                            sx={{ fontSize: '13px', textTransform: 'none' }}
                        />
                        <Tab
                            label="Description"
                            sx={{ fontSize: '13px', textTransform: 'none' }}
                        />
                        <Tab
                            label="Logical Names"
                            sx={{ fontSize: '13px', textTransform: 'none' }}
                        />
                        <Tab
                            label="Sample Instance"
                            sx={{ fontSize: '13px', textTransform: 'none' }}
                        />
                    </Tabs>
                    <Box flex={1} sx={{ overflowY: 'auto', padding: '20px' }}>
                        {tabIndex === 0 && (
                            <div>
                                <TextField
                                    fullWidth
                                    label="Edit Alias"
                                    value={editAlias}
                                    onChange={(e) =>
                                        setEditAlias(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    select
                                    label="Select a DataType"
                                    value={selectedDataType}
                                    onChange={(e) =>
                                        setSelectedDataType(e.target.value)
                                    }
                                    sx={{ mt: 2 }}
                                >
                                    <MenuItem value="String">String</MenuItem>
                                    <MenuItem value="Number">Number</MenuItem>
                                    <MenuItem value="Date">Date</MenuItem>
                                </TextField>
                                <TextField
                                    fullWidth
                                    select
                                    label="Select a Format"
                                    value={selectedFormat}
                                    onChange={(e) =>
                                        setSelectedFormat(e.target.value)
                                    }
                                    sx={{ mt: 2 }}
                                >
                                    <MenuItem value="JSON">JSON</MenuItem>
                                    <MenuItem value="CSV">CSV</MenuItem>
                                    <MenuItem value="XML">XML</MenuItem>
                                </TextField>
                            </div>
                        )}

                        {tabIndex === 1 && (
                            <div>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={4}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />
                            </div>
                        )}

                        {tabIndex === 2 && (
                            <div>
                                <TextField
                                    fullWidth
                                    label="Current Logical Name"
                                    value={selectedColumn || ''}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label="Enter New Logical Name"
                                    value={logicalName}
                                    onChange={(e) =>
                                        setLogicalName(e.target.value)
                                    }
                                />
                            </div>
                        )}

                        {tabIndex === 3 && (
                            <TextField fullWidth label="Search" />
                        )}
                    </Box>
                    <Box
                        display="flex"
                        justifyContent="flex-end"
                        padding="10px"
                    >
                        <Button
                            onClick={() => setOpenModal(false)}
                            variant="outlined"
                            sx={{ mr: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" color="primary">
                            Save
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DataSelection;
