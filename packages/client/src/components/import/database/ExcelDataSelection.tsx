import {
    CreateOutlined,
    ExpandMore,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Collapse,
    Icon,
    IconButton,
    Stack,
    styled,
    Table,
    TextField,
    Typography,
} from "@semoss/ui";
import ColumnEditModal from "./ColumnEditModal";
import { CSV_UPLOAD_ICONS } from "./database.constants";

const StyledHeaderWrapper = styled("div")(({ theme }) => ({
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2),
}));

const StyledBodyWrapper = styled("div")(({ theme }) => ({
    backgroundColor: "#fff",
    border: "1px solid #C4C4C4",
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    marginTop: 0,
    marginBottom: theme.spacing(4),
}));

const StyledTypography = styled(Typography)({
    color: "#212121",
    paddingLeft: "5px",
});

const StyledTableTypography = styled(Typography)({
    color: "#212121",
    fontSize: "14px",
});

const StyledSummaryHeader = styled(Stack)(({ theme }) => ({
    backgroundColor: "#f2f2f2",
    borderRadius: `${theme.shape.borderRadius}px 0px ${theme.shape.borderRadius}px 0px 0px`,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2),
    cursor: "pointer",
}));

const StyledTypographyTitle = styled(Typography)({
    fontSize: "16px",
    color: "#212121",
});

const StyledExpandMoreIcon = styled(Icon)<{ collapse?: boolean }>(
    ({ collapse }) => ({
        transform: collapse ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s",
    }),
);

const StyledInnerBox = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(2),
}));

const StyledSelectAllButton = styled(Button)({
    textTransform: "capitalize",
    fontSize: "14px",
    fontWeight: 600,
});

const StyledTableContainer = styled(Table.Container)({
    maxHeight: "400px",
    overflow: "auto",
});

const StyledBaseTableCell = styled(Table.Cell)(({ theme }) => ({
    borderBottom: 0,
    boxShadow: `0px -1px 0px 0px ${theme.palette.grey[300]} inset`,
}));

const StyledTableCell = styled(StyledBaseTableCell)(({ theme }) => ({
    padding: theme.spacing(1, 3, 1, 2),
}));

const StyedNameTextField = styled(TextField)({
    "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
        borderStyle: "dotted",
    },
    "& .MuiInputBase-input": {
        color: "#666",
    },
});

const StyledFooterWrapper = styled("div")(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    marginTop: theme.spacing(2),
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
}));

interface ParsedResult {
    headers: string[];
    dataTypes: Record<string, string>;
    cleanHeaders: string[];
}
interface ExcelDataSelectionProps {
    files: ParsedResult[];
    fileName: string[];
    onImport: any;
    onCancel: () => void;
}

interface ColumnMetadata {
    alias?: string;
    dataType?: string;
    format?: string;
    description?: string;
    logicalName?: string[];
}

const ExcelDataSelection = ({
    files,
    fileName,
    onImport,
    onCancel,
}: ExcelDataSelectionProps) => {
    console.log("Files in ExcelDataSelection:", fileName);
    const [tableStates, setTableStates] = useState<Record<
        string,
        {
            rowEditableState: Record<number, boolean>;
            columnMetadata: Record<string, ColumnMetadata>;
            collapseAll: boolean;
        }
    >>({});

    const [openModal, setOpenModal] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [selectedSheetKey, setSelectedSheetKey] = useState<string | null>(null);

    // Safely get column metadata for modal
    const columnMetadata =
        selectedSheetKey && selectedColumn
            ? tableStates[selectedSheetKey]?.columnMetadata[selectedColumn]
            : undefined;

    // Setter for column metadata
    const setColumnMetadata = (updater: (prev: Record<string, ColumnMetadata>) => Record<string, ColumnMetadata>) => {
    if (!selectedSheetKey) return;
    setTableStates((prev) => ({
        ...prev,
        [selectedSheetKey]: {
            ...prev[selectedSheetKey],
            columnMetadata: updater(prev[selectedSheetKey].columnMetadata),
        },
    }));
};

    useEffect(() => {
        const newTableStates: typeof tableStates = {};
        files.forEach((file, fileIndex) => {
            const sheetNames = Object.keys(file || {});
            sheetNames.forEach((sheetName) => {
                const range = Object.keys(file[sheetName])[0];
                const parsedData = file[sheetName][range];
                if (!parsedData) return;

                newTableStates[`${fileIndex}-${sheetName}`] = {
                    rowEditableState: Object.fromEntries(
                        parsedData.cleanHeaders.map((_, index) => [index, true]),
                    ),
                    columnMetadata: Object.fromEntries(
                        parsedData.cleanHeaders.map((header) => [
                            header,
                            {
                                alias: header,
                                dataType: parsedData.dataTypes?.[header] || "String",
                                format: "",
                                description: "",
                                logicalName: [],
                            },
                        ]),
                    ),
                    collapseAll: true,
                };
            });
        });
        setTableStates(newTableStates);
    }, [files]);

    const toggleRowEditState = (sheetKey: string, index: number) => {
        setTableStates((prev) => ({
            ...prev,
            [sheetKey]: {
                ...prev[sheetKey],
                rowEditableState: {
                    ...prev[sheetKey].rowEditableState,
                    [index]: !prev[sheetKey].rowEditableState[index],
                },
            },
        }));
    };

    const handleOpenModal = (sheetKey: string, column: string) => {
        setSelectedSheetKey(sheetKey);
        setSelectedColumn(column);
        setOpenModal(true);
    };

   const handleNameChange = (sheetKey: string, column: string, newValue: string) => {
    setTableStates((prev) => ({
        ...prev,
        [sheetKey]: {
            ...prev[sheetKey],
            columnMetadata: {
                ...prev[sheetKey].columnMetadata,
                [column]: {
                    ...prev[sheetKey].columnMetadata[column],
                    alias: newValue,
                },
            },
        },
    }));
};


    const toggleCollapse = (sheetKey: string) => {
        setTableStates((prev) => ({
            ...prev,
            [sheetKey]: {
                ...prev[sheetKey],
                collapseAll: !prev[sheetKey].collapseAll,
            },
        }));
    };

    const handleSelectAllToggle = (sheetKey: string) => {
        const areAllSelected = Object.values(tableStates[sheetKey].rowEditableState).every((row) => row);
        const newState = Object.fromEntries(
            Object.keys(tableStates[sheetKey].rowEditableState).map((key) => [Number(key), !areAllSelected]),
        );
        setTableStates((prev) => ({
            ...prev,
            [sheetKey]: { ...prev[sheetKey], rowEditableState: newState },
        }));
    };

    const handleImport = () => {
        const payloadArray = files.map((file, fileIndex) => {
            const dataTypeMap: Record<string, Record<string, Record<string, string>>> = {};
            const newHeaders: Record<string, Record<string, Record<string, string>>> = {};
            const additionalDataTypes: Record<string, Record<string, Record<string, string>>> = {}; // <-- Fix here
            // Flatten these instead of grouping by sheet
            const descriptionMap: Record<string, string> = {};
            const logicalNamesMap: Record<string, string[]> = {};

            const sheetNames = Object.keys(file || {});
            sheetNames.forEach((sheetName) => {
                const range = Object.keys(file[sheetName])[0];
                const parsedData = file[sheetName][range];
                const state = tableStates[`${fileIndex}-${sheetName}`];
                if (!parsedData || !state) return;

                dataTypeMap[sheetName] = { [range]: {} };
                newHeaders[sheetName] = {};
                additionalDataTypes[sheetName] = { [range]: {} }; // <-- Fix here

                parsedData.cleanHeaders.forEach((header) => {
                    const alias = state.columnMetadata[header]?.alias || header;

                    dataTypeMap[sheetName][range][alias] =
                        state.columnMetadata[header]?.dataType || "STRING";

                    if (alias !== header) {
                        if (!newHeaders[sheetName]) newHeaders[sheetName] = {};
                        if (!newHeaders[sheetName][range]) newHeaders[sheetName][range] = {};
                        newHeaders[sheetName][range][alias] = header;
                    }

                    // Fix: nest additionalDataTypes by sheet -> range -> alias
                    if (state.columnMetadata[header]?.format) {
                        additionalDataTypes[sheetName][range][alias] =
                            state.columnMetadata[header]?.format!;
                    }

                    // Flatten descriptionMap
                    if (state.columnMetadata[header]?.description) {
                        descriptionMap[alias] =
                            state.columnMetadata[header]!.description!;
                    }

                    // Flatten logicalNamesMap
                    if (
                        Array.isArray(state.columnMetadata[header]?.logicalName) &&
                        state.columnMetadata[header]!.logicalName!.length > 0
                    ) {
                        logicalNamesMap[alias] =
                            state.columnMetadata[header]!.logicalName!;
                    }
                });
            });

            return {
                filePath: [fileName[fileIndex]],
                dataTypeMap,
                newHeaders,
                additionalDataTypes,
                descriptionMap: descriptionMap,    
                logicalNamesMap: logicalNamesMap,
                existing: fileIndex === 0 ? false : true,
            };
        });

        onImport(payloadArray);
    };

    return (
        <>
            {files.map((file, fileIndex) => (
                <Box key={fileIndex} data-testid={`excel-file-box-${fileIndex}`}>
                    <StyledHeaderWrapper key={fileIndex} data-testid={`excel-file-header-${fileIndex}`}>
                        <Stack direction={"row"}>
                            <img src={CSV_UPLOAD_ICONS.FILE_EXCEL} alt="Excel File" data-testid={"excel-file-icon"} />
                            <StyledTypography variant="h6" data-testid={`excel-file-name-${fileIndex}`}>
                                {fileName[fileIndex]}
                            </StyledTypography>
                        </Stack>
                    </StyledHeaderWrapper>

                    {Object.keys(file || {}).map((sheetName) => {
                        const range = Object.keys(file[sheetName])[0];
                        const parsedData = file[sheetName][range];
                        const state = tableStates[`${fileIndex}-${sheetName}`];

                        if (!state || !parsedData) return null;

                        return (
                            <StyledBodyWrapper key={`${fileIndex}-${sheetName}`} data-test-id={`excel-sheet-${fileIndex}-${sheetName}`}>
                                <StyledSummaryHeader
                                    onClick={() => toggleCollapse(`${fileIndex}-${sheetName}`)}
                                    data-test-id={`excel-sheet-summary-${fileIndex}-${sheetName}`}
                                >
                                    <StyledTypographyTitle variant="h6" data-test-id={`excel-sheet-title-${fileIndex}-${sheetName}`}>
                                        Sheet Name: {sheetName}
                                    </StyledTypographyTitle>
                                    <StyledExpandMoreIcon collapse={state.collapseAll} data-test-id={`excel-sheet-expand-icon-${fileIndex}-${sheetName}`}>
                                        <ExpandMore />
                                    </StyledExpandMoreIcon>
                                </StyledSummaryHeader>

                                <Collapse in={state.collapseAll}>
                                    <Box>
                                        <StyledInnerBox>
                                            <StyledTypographyTitle variant="h6" data-test-id={`excel-sheet-table-name-${fileIndex}-${sheetName}`}>
                                                Table Name: {sheetName}
                                            </StyledTypographyTitle>
                                            <StyledSelectAllButton
                                                size="small"
                                                variant="text"
                                                color="primary"
                                                onClick={() =>
                                                    handleSelectAllToggle(`${fileIndex}-${sheetName}`)
                                                }
                                                data-test-id={`excel-sheet-select-all-button-${fileIndex}-${sheetName}`}
                                            >
                                                {Object.values(state.rowEditableState).every((v) => v)
                                                    ? "Unselect All"
                                                    : "Select All"}
                                            </StyledSelectAllButton>
                                        </StyledInnerBox>

                                        <StyledInnerBox>
                                            <StyledTypographyTitle variant="h6" data-test-id={`excel-sheet-range-${fileIndex}-${sheetName}`}>
                                                Range: {range}
                                            </StyledTypographyTitle>
                                        </StyledInnerBox>

                                        <StyledTableContainer>
                                            <Table>
                                                <Table.Head>
                                                    <Table.Row>
                                                        <StyledTableCell sx={{ width: "66%" }}>
                                                            <StyledTableTypography variant="h6">
                                                                Name
                                                            </StyledTableTypography>
                                                        </StyledTableCell>
                                                        <StyledTableCell sx={{ width: "20%" }}>
                                                            <StyledTableTypography variant="h6">
                                                                Data Type
                                                            </StyledTableTypography>
                                                        </StyledTableCell>
                                                        <StyledTableCell sx={{ width: "7%" }} />
                                                        <StyledTableCell sx={{ width: "7%" }} />
                                                    </Table.Row>
                                                </Table.Head>

                                                <Table.Body>
                                                    {parsedData.cleanHeaders.map((column, index) => (
                                                        <Table.Row key={column} data-test-id={`excel-sheet-row-${fileIndex}-${sheetName}-${column}`}>
                                                            <StyledBaseTableCell sx={{ width: "66%" }}>
                                                                <StyedNameTextField
                                                                    fullWidth
                                                                    value={
                                                                        state.columnMetadata[column]?.alias ?? column
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleNameChange(
                                                                            `${fileIndex}-${sheetName}`,
                                                                            column,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    variant="outlined"
                                                                    size="small"
                                                                    disabled={!state.rowEditableState[index]}
                                                                    data-test-id={`excel-column-alias-${fileIndex}-${sheetName}-${column}`}
                                                                />
                                                            </StyledBaseTableCell>

                                                            <StyledBaseTableCell
                                                                sx={{
                                                                    width: "20%",
                                                                    pointerEvents: !state.rowEditableState[index]
                                                                        ? "none"
                                                                        : "auto",
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="h6"
                                                                    sx={{
                                                                        fontSize: "14px",
                                                                        color: !state.rowEditableState[index]
                                                                            ? "#9E9E9E"
                                                                            : "#212121",
                                                                    }}
                                                                    data-test-id={`excel-column-datatype-${fileIndex}-${sheetName}-${column}`}
                                                                >
                                                                    {state.columnMetadata[column]?.dataType ||
                                                                        "STRING"}
                                                                </Typography>
                                                            </StyledBaseTableCell>

                                                            <StyledBaseTableCell sx={{ width: "7%" }}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleOpenModal(
                                                                            `${fileIndex}-${sheetName}`,
                                                                            column
                                                                        )
                                                                    }
                                                                    disabled={!state.rowEditableState[index]}
                                                                    data-test-id={`excel-column-edit-button-${fileIndex}-${sheetName}-${column}`}
                                                                >
                                                                    <CreateOutlined />
                                                                </IconButton>
                                                            </StyledBaseTableCell>

                                                            <StyledBaseTableCell sx={{ width: "7%" }}>
                                                                <IconButton
                                                                    onClick={() =>
                                                                        toggleRowEditState(
                                                                            `${fileIndex}-${sheetName}`,
                                                                            index
                                                                        )
                                                                    }
                                                                    data-test-id={`excel-column-toggle-button-${fileIndex}-${sheetName}-${column}`}
                                                                >
                                                                    {state.rowEditableState[index] ? (
                                                                        <CloseIcon color="error" />
                                                                    ) : (
                                                                        <AddIcon color="success" />
                                                                    )}
                                                                </IconButton>
                                                            </StyledBaseTableCell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table>
                                        </StyledTableContainer>
                                    </Box>
                                </Collapse>
                            </StyledBodyWrapper>
                        );
                    })}
                </Box>
            ))}

            <StyledFooterWrapper>
                <Button variant="outlined" color="primary" onClick={onCancel} data-test-id={"excel-cancel-button"}>
                    Back
                </Button>
                <Button variant="contained" color="primary" onClick={handleImport} data-test-id={"excel-import-button"}>
                    Import
                </Button>
            </StyledFooterWrapper>

<ColumnEditModal
    open={openModal}
    onClose={() => setOpenModal(false)}
    selectedColumn={selectedColumn}
    columnMetadata={
        selectedSheetKey
            ? tableStates[selectedSheetKey]?.columnMetadata ?? {}
            : {}
    }
    setColumnMetadata={setColumnMetadata}
/>

        </>
    );
};

export default ExcelDataSelection;
