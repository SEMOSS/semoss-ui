import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Button,
} from '@mui/material';

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
    const [selectedColumns, setSelectedColumns] = useState<
        Record<string, boolean>
    >({});

    return (
        <div>
            <h3>Data Selection</h3>
            <TableContainer sx={{ maxHeight: '400px', overflow: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Data Type</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {files.cleanHeaders.map((column, index) => (
                            <TableRow key={index}>
                                <TableCell>{column}</TableCell>
                                <TableCell>
                                    {files.dataTypes[column] || 'Unknown'}
                                </TableCell>
                                <TableCell></TableCell>
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
                }}
            >
                <div style={{ marginTop: '20px' }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onImport}
                    >
                        Import
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DataSelection;
