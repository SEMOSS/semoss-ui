import React, { useState, useEffect, useMemo } from 'react';
import {
    Stack,
    IconButton,
    CircularProgress,
    Icon,
    Menu,
    List,
    Divider,
    Button,
    Tabs,
    Typography,
    styled,
    useNotification,
    Modal,
} from '@semoss/ui';
import { Add, DragIndicator } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useBlocks, useRootStore, useWorkspace } from '@/hooks';
import { NewQueryOverlay } from './NewQueryOverlay';
import { ActionMessages, QueryState } from '@/stores';
import {
    Api,
    ContentCopy,
    Download,
    Delete,
    MoreVert,
} from '@mui/icons-material';

const StyledSheet = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: selected
        ? theme.palette.background.paper
        : theme.palette.background.default,
    color: '#666',
    maxWidth: '225px',
    maxHeight: '125px',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledButtonContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.primary.hover,
    },
}));

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    width: theme.spacing(4),
    minWidth: 'unset',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    overflowX: 'auto',
    maxHeight: '180px', // Set a max height to trigger scrolling
    maxWidth: '95%',
}));

const StyledRedDot = styled('div')(({ theme }) => ({
    width: '.50em',
    height: '.50em',
    backgroundColor: theme.palette.error.main,
    borderRadius: '50%',
}));

const StyledGreenDot = styled('div')(({ theme }) => ({
    width: '.50em',
    height: '.50em',
    backgroundColor: theme.palette.success.main,
    borderRadius: '50%',
}));

interface QueryWithIndex {
    /**
     * Query to bind to
     */
    q: QueryState;
    /**
     * Track what index got removed
     */
    index: number;
}

export const NotebookSheetsMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();

    const { workspace } = useWorkspace();
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const [query, setQuery] = useState<QueryWithIndex | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [orderedSheets, setOrderedSheets] = useState([]);
    const open = Boolean(anchorEl);

    const [sheetOrderMenuOpen, setSheetOrderMenuOpen] = useState(false);

    /**
     * Selects a sheet on mount
     */
    useEffect(() => {
        if (notebook.selectedQuery) return;

        if (notebook.notebooksList.length) {
            let i = 0,
                selected = false;
            while (!selected) {
                notebook.selectQuery(notebook.notebooksList[i].id);
                selected = true;
                i++;
            }
        } else {
            // Create a query for user
            const id = state.dispatch({
                message: ActionMessages.NEW_QUERY,
                payload: {
                    queryId: 'default',
                    config: {
                        cells: [
                            {
                                id: `${Math.floor(Math.random() * 100000)}`,
                                widget: 'code',
                                parameters: {
                                    code: '',
                                    type: 'py',
                                },
                            },
                        ],
                    },
                },
            });

            notebook.selectQuery(id);
        }
    }, []);

    /**
     * Edit or create a query
     */
    const openQueryOverlay = () => {
        workspace.openOverlay(() => (
            <NewQueryOverlay
                onClose={(newQueryId?: string) => {
                    if (newQueryId) {
                        notebook.selectQuery(newQueryId);
                    }
                    workspace.closeOverlay();
                }}
            />
        ));
    };

    // requests download id with DownloadAppNotebook pixel and appId then downloads with monolithStore.download
    const exportHandler = async () => {
        workspace.setLoading(true);

        try {
            // export  the app
            const response = await monolithStore.runQuery<[string]>(
                `DownloadAppNotebook ( "${workspace.appId}" ) ;`,
            );

            const key = response.pixelReturn[0].output;
            // throw an error if there is no key
            // throw an error if index / size return as 0 indicating app is new and has not yet been saved
            if (!key) {
                notification.add({
                    color: 'error',
                    message: 'Error downloading app notebook',
                });
            } else if (key == 'Index: 0, Size: 0') {
                notification.add({
                    color: 'error',
                    message:
                        'Error downloading app notebook. Save new apps before downloading.',
                });
            } else {
                // if no issues are indicated in the return download the app
                await monolithStore.download(configStore.store.insightID, key);
                notification.add({
                    color: 'success',
                    message: 'Success',
                });
            }
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            workspace.setLoading(false);
        }
    };

    /**
     * Copy a query
     * @param id - id of the query to copy
     */
    const duplicateQuery = (id: string) => {
        try {
            // get the query
            const query = state.getQuery(id);
            if (!query) {
                notification.add({
                    color: 'error',
                    message: `Cannot find query ${id}`,
                });
            }

            // get the json
            const json = query.toJSON();

            // get a new id
            const newQueryId = `${json.id} Copy`;

            // dispatch it
            state.dispatch({
                message: ActionMessages.NEW_QUERY,
                payload: {
                    queryId: newQueryId,
                    config: {
                        cells: json.cells,
                    },
                },
            });

            // close the options and select it
            handleQueryOptionsMenuClose();
            notebook.selectQuery(newQueryId);
        } catch (e) {
            // log it
            console.error(e);

            // notify the user
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    const handleQueryOptionsMenuClose = () => {
        setQuery(null);
        setAnchorEl(null);
    };

    const getSheetStatusIcon = (query) => {
        if (query.isSuccessful) {
            return <StyledGreenDot />;
        } else if (query.isError) {
            return <StyledRedDot />;
        } else {
            return;
        }
    };

    const sheets = useMemo(() => {
        const orderedRows = [];

        state.executionOrder.forEach((sheetId) => {
            orderedRows.push({
                id: sheetId,
                Parameters: '[]',
            });
        });

        return orderedRows;
    }, [JSON.stringify(state.executionOrder)]);

    return (
        <Stack
            direction={'row'}
            justifyContent={'space-between'}
            sx={{ maxWidth: '100%' }}
        >
            <Stack direction={'row'} sx={{ maxWidth: '95%' }}>
                <StyledStack direction="row" spacing={0}>
                    {notebook.notebooksList.map((q, i) => {
                        return (
                            <StyledSheet
                                key={i}
                                selected={q.id === notebook.selectedQuery?.id}
                                onClick={(e) => {
                                    notebook.selectQuery(q.id);
                                }}
                            >
                                {getSheetStatusIcon(q)}
                                <Typography
                                    variant={'body2'}
                                    fontWeight="bold"
                                    sx={{
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {q.id}
                                </Typography>
                                <IconButton
                                    size={'small'}
                                    onClick={(
                                        event: React.MouseEvent<HTMLElement>,
                                    ) => {
                                        setQuery({
                                            q: q,
                                            index: i,
                                        });
                                        setAnchorEl(event.currentTarget);
                                        event.stopPropagation();
                                    }}
                                >
                                    <MoreVert />
                                </IconButton>
                            </StyledSheet>
                        );
                    })}

                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleQueryOptionsMenuClose}
                    >
                        <List disablePadding dense>
                            <List.Item disablePadding>
                                <List.ItemButton
                                    onClick={() => {
                                        duplicateQuery(query.q.id);
                                    }}
                                >
                                    <StyledListIcon>
                                        <ContentCopy
                                            color="inherit"
                                            fontSize="small"
                                        />
                                    </StyledListIcon>
                                    <List.ItemText primary="Duplicate" />
                                </List.ItemButton>
                            </List.Item>
                            <List.Item disablePadding>
                                <List.ItemButton onClick={exportHandler}>
                                    <StyledListIcon>
                                        <Download
                                            color="inherit"
                                            fontSize="small"
                                        />
                                    </StyledListIcon>
                                    <List.ItemText primary="Export" />
                                </List.ItemButton>
                            </List.Item>
                            <Divider />
                            <List.Item disablePadding>
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message:
                                                ActionMessages.DELETE_QUERY,
                                            payload: {
                                                queryId: query.q.id,
                                            },
                                        });
                                        if (notebook.notebooksList.length) {
                                            const nextQueryIndex =
                                                query.index >=
                                                notebook.notebooksList.length
                                                    ? notebook.notebooksList
                                                          .length - 1
                                                    : query.index;
                                            notebook.selectQuery(
                                                notebook.notebooksList[
                                                    nextQueryIndex
                                                ].id,
                                            );
                                        }
                                        handleQueryOptionsMenuClose();
                                    }}
                                >
                                    <StyledListIcon>
                                        <Delete
                                            color="error"
                                            fontSize="small"
                                        />
                                    </StyledListIcon>
                                    <List.ItemText
                                        primary="Delete"
                                        primaryTypographyProps={{
                                            color: 'error',
                                        }}
                                    ></List.ItemText>
                                </List.ItemButton>
                            </List.Item>
                        </List>
                    </Menu>
                </StyledStack>
                <StyledButtonContainer>
                    <StyledIconButton
                        size="small"
                        onClick={() => {
                            openQueryOverlay();
                        }}
                    >
                        <Icon color="primary">
                            <Add />
                        </Icon>
                    </StyledIconButton>
                </StyledButtonContainer>
            </Stack>
            <Modal
                open={sheetOrderMenuOpen}
                onClose={() => setSheetOrderMenuOpen(false)}
                maxWidth={'xl'}
            >
                <Modal.Title>API Order</Modal.Title>
                <Modal.Content sx={{ width: '600px' }}>
                    <Stack>
                        <DraggableTable
                            rowsData={sheets}
                            onReorder={(e) => {
                                console.log('reorder', e);
                                setOrderedSheets(e);
                            }}
                        />
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => {
                            setOrderedSheets([]);
                            setSheetOrderMenuOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            const formatted = [];
                            orderedSheets.forEach((s) => {
                                formatted.push(s.id);
                            });

                            state.dispatch({
                                message:
                                    ActionMessages.SET_SHEET_EXECUTION_ORDER,
                                payload: {
                                    list: formatted,
                                },
                            });

                            setOrderedSheets([]);
                            setSheetOrderMenuOpen(false);
                        }}
                    >
                        Set
                    </Button>
                </Modal.Actions>
            </Modal>

            <StyledIconButton
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    setSheetOrderMenuOpen(true);
                    event.stopPropagation();
                }}
            >
                <Icon color="primary">
                    <Api />
                </Icon>
            </StyledIconButton>
        </Stack>
    );
});

import { useRef } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// Styled components using MUI's styled
const StyledTable = styled(Table)({
    // minWidth: 650,
});

const StyledTableCell = styled(TableCell)({
    textAlign: 'center',
    fontWeight: 'bold',
});

const DraggableTableRow = styled(TableRow, {
    shouldForwardProp: (prop) => prop !== 'isDragging',
})<{
    isDragging: boolean;
}>(({ theme, isDragging }) => ({
    backgroundColor: isDragging ? '#f1f1f1' : 'white',
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
}));

const DraggableTable = ({ rowsData, onReorder }) => {
    const [rows, setRows] = useState(rowsData);
    const dragItem = useRef();
    const dragOverItem = useRef();

    // Handle dragging the row
    const handleDragStart = (index) => {
        dragItem.current = index;
    };

    // Handle drag over event
    const handleDragEnter = (index) => {
        dragOverItem.current = index;
    };

    // Handle drag end event
    const handleDragEnd = () => {
        const newRows = [...rows];
        if (typeof dragItem.current !== 'number') return;
        const draggedRow = newRows[dragItem.current];
        newRows.splice(dragItem.current, 1); // Remove the dragged item
        newRows.splice(dragOverItem.current, 0, draggedRow); // Re-insert at new position

        dragItem.current = null;
        dragOverItem.current = null;

        setRows(newRows);
        onReorder(newRows); // Trigger callback with the reordered list
    };

    const keys = Object.keys(rows[0] ? rows[0] : {});

    return (
        <StyledTable>
            <TableHead>
                <TableRow>
                    <StyledTableCell sx={{ width: '20px' }}> </StyledTableCell>
                    {keys.map((key) => {
                        return (
                            <StyledTableCell key={`table-head-${key}`}>
                                {key}
                            </StyledTableCell>
                        );
                    })}
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map((row, index) => (
                    <DraggableTableRow
                        key={row.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        isDragging={dragItem.current === index}
                    >
                        <TableCell sx={{ width: '20px' }}>
                            <Icon>
                                <DragIndicator />
                            </Icon>
                        </TableCell>
                        {keys.map((key) => {
                            return (
                                <TableCell key={`table-row-${row.id}-${key}`}>
                                    {row[`${key}`]}
                                </TableCell>
                            );
                        })}
                    </DraggableTableRow>
                ))}
            </TableBody>
        </StyledTable>
    );
};

export default DraggableTable;
