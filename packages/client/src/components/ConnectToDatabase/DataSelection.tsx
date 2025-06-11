import React, { useEffect, useState } from 'react';
import {
    IconButton,
    Select,
    Button,
    styled,
    TextField,
    Typography,
    Stack,
    MenuItem,
} from '@semoss/ui';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import {
    Add,
    CreateOutlined,
    Delete,
    ExpandMore,
    UnfoldLess,
    UnfoldMore,
} from '@mui/icons-material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { CSV_UPLOAD_ICONS } from '@/pages/import';

interface ImportFileProps {
    files: {
        headers: string[];
        dataTypes: Record<string, string>;
        cleanHeaders: string[];
    };
    fileName: string;
    onImport: (payload: any) => Promise<void>;
    onCancel: () => void;
}

const StyledTypography = styled(Typography)({
    color: '#212121',
    paddingLeft: '5px',
});

const StyledTableNameDiv = styled('div')({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    margin: '15px 0 0',
    padding: '0 15px 10px',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
});

const DataSelection: React.FC<ImportFileProps> = ({
    files,
    fileName,
    onImport,
    onCancel,
}) => {
    const [editableFields, setEditableFields] = useState<{
        [key: number]: string;
    }>({});
    const parsedData = files[0];
    const [rowEditableState, setRowEditableState] = useState<{
        [key: number]: boolean;
    }>(
        Object.fromEntries(
            parsedData.cleanHeaders.map((_, index) => [index, true]),
        ),
    );
    const [openModal, setOpenModal] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [columnMetadata, setColumnMetadata] = useState<{
        [column: string]: {
            alias?: string;
            dataType?: string;
            format?: string;
            description?: string;
            logicalName?: string[];
        };
    }>({});
    const [tabIndex, setTabIndex] = useState(0);
    const [editAlias, setEditAlias] = useState('');
    const [selectedDataType, setSelectedDataType] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('');
    const [description, setDescription] = useState('');
    const [logicalName, setLogicalName] = useState('');
    const [collapseAll, setCollapseAll] = useState(true);
    const [logicalNamesList, setLogicalNamesList] = useState<string[]>([]);
    const [availableFormats, setAvailableFormats] = useState<
        { display: string; value: string }[]
    >([]);

    const dataTypeOptions = [
        { label: 'String', value: 'STRING' },
        { label: 'Integer', value: 'INT' },
        { label: 'Double', value: 'DOUBLE' },
        { label: 'Date', value: 'DATE' },
        { label: 'Timestamp', value: 'TIMESTAMP' },
    ];

    const formatOptions = [
        {
            display: 'String',
            value: 'STRING',
            formats: [],
        },
        {
            display: 'Integer',
            value: 'INT',
            formats: [
                {
                    display: '1000',
                    value: 'int_default',
                    isDefault: true,
                },
                {
                    display: '1,000',
                    value: 'int_comma',
                },
                {
                    display: '$1000',
                    value: 'int_currency',
                },
                {
                    display: '$1,000',
                    value: 'int_currency_comma',
                },
                {
                    display: '10%',
                    value: 'int_percent',
                },
                {
                    display: '1.00k',
                    value: 'thousand',
                },
                {
                    display: '1.00M',
                    value: 'million',
                },
                {
                    display: '1.00B',
                    value: 'billion',
                },
                {
                    display: '1.00T',
                    value: 'trillion',
                },
                {
                    display: 'Accounting ($)',
                    value: 'accounting',
                },
                {
                    display: 'Scientific (1.00E+03)',
                    value: 'scientific',
                },
            ],
        },
        {
            display: 'Double',
            value: 'DOUBLE',
            formats: [
                {
                    display: '1000.00',
                    value: 'double_round2',
                    isDefault: true,
                },
                {
                    display: '1000.0',
                    value: 'double_round1',
                },
                {
                    display: '1000.000',
                    value: 'double_round3',
                },
                {
                    display: '1,000.0',
                    value: 'double_comma_round1',
                },
                {
                    display: '1,000.00',
                    value: 'double_comma_round2',
                },
                {
                    display: '$1,000.00',
                    value: 'double_currency_comma_round2',
                },
                {
                    display: '10.0%',
                    value: 'double_percent_round1',
                },
                {
                    display: '10.00%',
                    value: 'double_percent_round2',
                },
                {
                    display: '1.00k',
                    value: 'thousand',
                },
                {
                    display: '1.00M',
                    value: 'million',
                },
                {
                    display: '1.00B',
                    value: 'billion',
                },
                {
                    display: '1.00T',
                    value: 'trillion',
                },
                {
                    display: 'Accounting ($)',
                    value: 'accounting',
                },
                {
                    display: 'Scientific (1.00E+03)',
                    value: 'scientific',
                },
            ],
        },
        {
            display: 'Date',
            value: 'DATE',
            formats: [
                {
                    display: '1879-03-14',
                    value: 'yyyy-MM-dd',
                    isDefault: true,
                },

                {
                    display: '03/14/1879',
                    value: 'MM/dd/yyyy',
                },
                {
                    display: '3/14/1879',
                    value: 'M/d/yyyy',
                },

                {
                    display: '03/14/79',
                    value: 'MM/dd/yy',
                },

                {
                    display: '03/14',
                    value: 'MM/dd',
                },

                {
                    display: 'March 14, 1879',
                    value: 'MMMMM d, yyyy',
                },

                {
                    display: '14-Mar',
                    value: 'dd-MMM',
                },

                {
                    display: '14-Mar-79',
                    value: 'dd-MMM-yy',
                },

                {
                    display: '14-Mar-1879',
                    value: 'dd-MMM-yyyy',
                },

                {
                    display: 'Mar-79',
                    value: 'MMM-yy',
                },

                {
                    display: 'Friday, March 14, 1879',
                    value: 'EEEEE, MMMMM d, yyyy',
                },
                {
                    display: '1879',
                    value: 'yyyy',
                },
                {
                    display: '187903',
                    value: 'yyyyMM',
                },
                {
                    display: '18790314',
                    value: 'yyyyMMdd',
                },
            ],
        },
        {
            display: 'Timestamp',
            value: 'TIMESTAMP',
            formats: [
                {
                    display: '1879-03-14 13:30:55',
                    value: 'yyyy-MM-dd HH:mm:ss',
                    isDefault: true,
                },
                {
                    display: '1879-03-14 1:30 PM',
                    value: 'yyyy-MM-dd hh:mm a',
                },
                {
                    display: '1879-03-14 13:30',
                    value: 'yyyy-MM-dd HH:mm',
                },
                {
                    display: '1879-03-14 1:30',
                    value: 'yyyy-MM-dd hh:mm',
                },
                {
                    display: '3/14/79 13:30:55',
                    value: 'M/d/yy HH:mm:ss',
                },
                {
                    display: '3/14/79 1:30 PM',
                    value: 'M/d/yy hh:mm a',
                },
                {
                    display: '3/14/79 13:30',
                    value: 'M/d/yy HH:mm',
                },
                {
                    display: '3/14/79 1:30',
                    value: 'M/d/yy hh:mm',
                },
            ],
        },
    ];

    useEffect(() => {
        if (parsedData?.cleanHeaders) {
            const initialMeta = Object.fromEntries(
                parsedData.cleanHeaders.map((header) => [
                    header,
                    {
                        alias: header,
                        dataType: parsedData.dataTypes?.[header] || 'String',
                        format: '',
                        description: '',
                        logicalName: [],
                    },
                ]),
            );
            setColumnMetadata(initialMeta);
        }
    }, [parsedData]);

    useEffect(() => {
        const optionsList = formatOptions.find(
            (opt) => opt.value === selectedDataType,
        );
        if (optionsList) {
            setAvailableFormats(optionsList.formats || []);
            const defaultFormat = optionsList.formats?.find(
                (ele) => ele.isDefault,
            );
            setSelectedFormat(defaultFormat?.value || '');
        } else {
            setAvailableFormats([]);
            setSelectedFormat('');
        }
    }, [selectedDataType]);

    const handleNameChange = (index: number, newValue: string) => {
        const column = parsedData.cleanHeaders[index];

        setEditableFields((prev) => ({
            ...prev,
            [index]: newValue,
        }));

        setColumnMetadata((prev) => ({
            ...prev,
            [column]: {
                ...prev[column],
                alias: newValue,
            },
        }));
    };

    const toggleRowEditState = (index: number) => {
        setRowEditableState((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handleOpenModal = (column: string) => {
        setSelectedColumn(column);
        setEditAlias(columnMetadata[column]?.alias || '');
        setSelectedDataType(columnMetadata[column]?.dataType || '');
        setDescription(columnMetadata[column]?.description || '');
        setSelectedFormat(columnMetadata[column]?.format || '');
        const logicalNamesFromMeta = columnMetadata[column]?.logicalName || [];
        setLogicalNamesList(
            Array.isArray(logicalNamesFromMeta) ? logicalNamesFromMeta : [],
        );
        setOpenModal(true);
    };

    const handleSaveMetadata = () => {
        if (!selectedColumn) return;

        setColumnMetadata((prev) => ({
            ...prev,
            [selectedColumn]: {
                ...prev[selectedColumn],
                alias: editAlias,
                dataType: selectedDataType,
                format: selectedFormat,
                description,
                logicalName: logicalNamesList,
            },
        }));

        const index = parsedData.cleanHeaders.indexOf(selectedColumn);
        if (index !== -1) {
            setEditableFields((prev) => ({
                ...prev,
                [index]: editAlias,
            }));
        }

        setOpenModal(false);
    };

    const handleAddLogicalName = () => {
        if (logicalName.trim()) {
            setLogicalNamesList((prev) => [...prev, logicalName.trim()]);
            setLogicalName('');
        }
    };

    const handleDeleteLogicalName = (index: number) => {
        setLogicalNamesList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleImport = () => {
        const originalHeaders = parsedData.cleanHeaders;
        const updatedHeaders = originalHeaders.map(
            (header: string, ids: number) =>
                editableFields[ids] !== undefined
                    ? editableFields[ids]
                    : header,
        );

        const dataTypeMap: Record<string, string> = {};
        const newHeaders: Record<string, string> = {};
        const descriptionMap: Record<string, string> = {};
        const logicalNamesMap: Record<string, string[]> = {};
        const additionalDataTypes: Record<string, string> = {};

        originalHeaders.forEach((original, index) => {
            const updated = updatedHeaders[index];
            const userMeta = columnMetadata[original] || {};
            const dataType =
                userMeta.dataType || parsedData.dataTypes[original];
            const alias = userMeta.alias;

            dataTypeMap[updated] = dataType;

            if (alias && alias !== original) {
                newHeaders[updated] = original;
            }

            if (userMeta.description) {
                descriptionMap[updated] = userMeta.description;
            }

            if (
                Array.isArray(userMeta.logicalName) &&
                userMeta.logicalName.length > 0
            ) {
                logicalNamesMap[updated] = userMeta.logicalName;
            }

            if (userMeta.format) {
                additionalDataTypes[updated] = userMeta.format;
            }
        });

        onImport({
            ...files,
            dataTypeMap,
            newHeaders,
            descriptionMap: Object.keys(descriptionMap).length
                ? descriptionMap
                : {},
            logicalNamesMap: Object.keys(logicalNamesMap).length
                ? logicalNamesMap
                : {},
            additionalDataTypes: Object.keys(additionalDataTypes).length
                ? additionalDataTypes
                : {},
        });
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                }}
            >
                <Stack direction={'row'}>
                    <img src={CSV_UPLOAD_ICONS.FILE_EXCEL} alt="Excel File" />
                    <StyledTypography variant="h6">{fileName}</StyledTypography>
                </Stack>
                <Button
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'capitalize',
                        padding: '8px 22px',
                        minWidth: '160px',
                        fontWeight: '600',
                    }}
                    size="large"
                    variant="outlined"
                    onClick={() => setCollapseAll(!collapseAll)}
                    startIcon={collapseAll ? <UnfoldLess /> : <UnfoldMore />}
                >
                    {collapseAll ? 'Collapse All' : 'Expand All'}
                </Button>
            </div>

            <Accordion
                expanded={collapseAll}
                onChange={() => setCollapseAll(!collapseAll)}
                sx={{
                    backgroundColor: '#fff',
                    boxShadow: 'none',
                    border: '1px solid #C4C4C4',
                    borderRadius: '12px 12px 0px 0px',
                    '&::before': { display: 'none' },
                    marginTop: '0',
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{
                        backgroundColor: '#f2f2f2',
                        borderRadius: '12px 12px 0px 0px',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: '16px',
                            color: '#212121',
                        }}
                    >
                        Sheet Name : {fileName}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                    }}
                >
                    <div>
                        <StyledTableNameDiv>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontSize: '16px',
                                    color: '#212121',
                                }}
                            >
                                Table Name: {fileName}
                            </Typography>
                            <Button
                                sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                }}
                                size="small"
                                variant="text"
                                color="primary"
                                onClick={() => {
                                    const areAllSelected = Object.values(
                                        rowEditableState,
                                    ).every((row) => row);
                                    const newState = Object.fromEntries(
                                        Object.keys(rowEditableState).map(
                                            (key) => [key, !areAllSelected],
                                        ),
                                    );
                                    setRowEditableState(newState);
                                }}
                            >
                                {Object.values(rowEditableState).every((v) => v)
                                    ? 'Unselect All'
                                    : 'Select All'}
                            </Button>
                        </StyledTableNameDiv>
                        <TableContainer
                            sx={{ maxHeight: '400px', overflow: 'auto' }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                width: '66%',
                                                padding: '8px 24px 8px 16px;',
                                                borderBottom: '0',
                                                boxShadow:
                                                    '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontSize: '14px',
                                                    color: '#212121',
                                                }}
                                            >
                                                Name
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                width: '20%',
                                                padding: '8px 24px 8px 16px;',
                                                borderBottom: '0',
                                                boxShadow:
                                                    '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontSize: '14px',
                                                    color: '#212121',
                                                }}
                                            >
                                                Data Type
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                width: '7%',
                                                padding: '8px 24px 8px 16px;',
                                                borderBottom: '0',
                                                boxShadow:
                                                    '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                            }}
                                        ></TableCell>
                                        <TableCell
                                            sx={{
                                                width: '7%',
                                                padding: '8px 24px 8px 16px;',
                                                borderBottom: '0',
                                                boxShadow:
                                                    '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                            }}
                                        ></TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {parsedData.cleanHeaders.map(
                                        (column, index) => (
                                            <TableRow key={index}>
                                                <TableCell
                                                    sx={{
                                                        width: '66%',
                                                        borderBottom: '0',
                                                        boxShadow:
                                                            '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                                    }}
                                                >
                                                    <TextField
                                                        fullWidth
                                                        value={
                                                            editableFields[
                                                                index
                                                            ] ?? column
                                                        }
                                                        onChange={(e) =>
                                                            handleNameChange(
                                                                index,
                                                                e.target.value,
                                                            )
                                                        }
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={
                                                            !rowEditableState[
                                                                index
                                                            ]
                                                        }
                                                        sx={{
                                                            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline':
                                                                {
                                                                    borderStyle:
                                                                        'dotted',
                                                                },
                                                            '& .MuiInputBase-input':
                                                                {
                                                                    color: '#666',
                                                                },
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        width: '20%',
                                                        borderBottom: '0',
                                                        boxShadow:
                                                            '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                                        pointerEvents:
                                                            !rowEditableState[
                                                                index
                                                            ]
                                                                ? 'none'
                                                                : 'auto',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontSize: '14px',
                                                            color: !rowEditableState[
                                                                index
                                                            ]
                                                                ? '#9E9E9E'
                                                                : '#212121',
                                                        }}
                                                    >
                                                        {columnMetadata[
                                                            column
                                                        ]?.dataType?.trim() ||
                                                            parsedData.dataTypes?.[
                                                                column
                                                            ]?.trim() ||
                                                            'String'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        width: '7%',
                                                        borderBottom: '0',
                                                        boxShadow:
                                                            '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                                    }}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleOpenModal(
                                                                column,
                                                            )
                                                        }
                                                        disabled={
                                                            !rowEditableState[
                                                                index
                                                            ]
                                                        }
                                                    >
                                                        <CreateOutlined />
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        width: '7%',
                                                        borderBottom: '0',
                                                        boxShadow:
                                                            '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset;',
                                                    }}
                                                >
                                                    <IconButton
                                                        onClick={() =>
                                                            toggleRowEditState(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        {rowEditableState[
                                                            index
                                                        ] ? (
                                                            <CloseIcon color="error" />
                                                        ) : (
                                                            <AddIcon color="success" />
                                                        )}
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </AccordionDetails>
            </Accordion>

            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                }}
            >
                <Button variant="outlined" color="primary" onClick={onCancel}>
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleImport}
                >
                    Import
                </Button>
            </div>

            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                fullWidth
                maxWidth="sm"
                sx={{
                    '& .MuiDialog-paper': {
                        width: '750px',
                        height: '750px',
                        maxWidth: '720px',
                    },
                }}
            >
                <DialogTitle>Edit {selectedColumn}</DialogTitle>
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
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        <Tab
                            label="Settings"
                            sx={{ fontSize: '14px', textTransform: 'none' }}
                        />
                        <Tab
                            label="Description"
                            sx={{ fontSize: '14px', textTransform: 'none' }}
                        />
                        <Tab
                            label="Logical Names"
                            sx={{ fontSize: '14px', textTransform: 'none' }}
                        />
                        <Tab
                            label="Sample Instance"
                            sx={{ fontSize: '14px', textTransform: 'none' }}
                        />
                    </Tabs>
                    <Box
                        flex={1}
                        sx={{ overflowY: 'auto', padding: '25px 0 10px' }}
                    >
                        {tabIndex === 0 && (
                            <div>
                                <TextField
                                    fullWidth
                                    label="Edit Alias"
                                    value={editAlias}
                                    onChange={(e) =>
                                        setEditAlias(e.target.value)
                                    }
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            padding: '15px',
                                            fontSize: '14px',
                                        },
                                    }}
                                />
                                <Select
                                    sx={{
                                        mt: 3,
                                        '& .MuiInputBase-input': {
                                            padding: '15px',
                                            fontSize: '14px',
                                        },
                                    }}
                                    size="small"
                                    fullWidth
                                    label="Select a DataType"
                                    value={selectedDataType}
                                    onChange={(e) =>
                                        setSelectedDataType(e.target.value)
                                    }
                                >
                                    {dataTypeOptions.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {selectedDataType !== 'STRING' && (
                                    <Select
                                        sx={{
                                            mt: 3,
                                            '& .MuiInputBase-input': {
                                                padding: '15px',
                                                fontSize: '14px',
                                            },
                                        }}
                                        size="small"
                                        fullWidth
                                        label="Select a Format"
                                        value={selectedFormat}
                                        onChange={(e) =>
                                            setSelectedFormat(e.target.value)
                                        }
                                    >
                                        {availableFormats.map((fmt) => (
                                            <MenuItem
                                                key={fmt.value}
                                                value={fmt.value}
                                            >
                                                {fmt.display}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                )}
                            </div>
                        )}

                        {tabIndex === 1 && (
                            <div>
                                <TextField
                                    fullWidth
                                    label="Edit Description"
                                    multiline
                                    rows={4}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                    }}
                                    variant="outlined"
                                    color="secondary"
                                    disabled
                                >
                                    Predict
                                </Button>
                            </div>
                        )}

                        {tabIndex === 2 && (
                            <div>
                                <Stack>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: '14px',
                                            color: '#666',
                                            fontWeight: '600',
                                            mb: 1,
                                        }}
                                    >
                                        Current Logical Name(s):
                                    </Typography>
                                </Stack>
                                <Table
                                    sx={{
                                        marginBottom: '15px',
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    width: '95%',
                                                    border: '1px solid lightgray',
                                                    padding: '5px 10px',
                                                    backgroundColor: '#f6f6f6',
                                                }}
                                            >
                                                Name
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    width: '5%',
                                                    border: '1px solid lightgray',
                                                    padding: '5px 10px',
                                                    backgroundColor: '#f6f6f6',
                                                }}
                                            ></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {logicalNamesList.map((name, index) => (
                                            <TableRow key={index}>
                                                <TableCell
                                                    sx={{
                                                        width: '95%',
                                                        border: '1px solid lightgray',
                                                        padding: '5px 10px',
                                                    }}
                                                >
                                                    {name}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        width: '5%',
                                                        border: '1px solid lightgray',
                                                        padding: '5px 10px',
                                                    }}
                                                >
                                                    <IconButton
                                                        color="secondary"
                                                        onClick={() =>
                                                            handleDeleteLogicalName(
                                                                index,
                                                            )
                                                        }
                                                        size="small"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Stack>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: '14px',
                                            color: '#666',
                                            fontWeight: '600',
                                            mb: 1,
                                        }}
                                    >
                                        Enter New Logical Name:
                                    </Typography>
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ mb: 2 }}
                                >
                                    <TextField
                                        size="small"
                                        value={logicalName}
                                        onChange={(e) =>
                                            setLogicalName(e.target.value)
                                        }
                                    />
                                    <IconButton
                                        onClick={handleAddLogicalName}
                                        disabled={!logicalName.trim()}
                                    >
                                        <Add />
                                    </IconButton>
                                </Stack>
                                <Button
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                    }}
                                    variant="outlined"
                                    color="secondary"
                                    disabled
                                >
                                    Predict
                                </Button>
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
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveMetadata}
                        >
                            Save
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DataSelection;
