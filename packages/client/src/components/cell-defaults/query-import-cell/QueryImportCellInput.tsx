import { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
    styled,
    Button,
    Menu,
    MenuProps,
    List,
    TextField,
    Stack,
} from '@semoss/ui';
import {
    AccountTree,
    CropFree,
    DriveFileRenameOutline,
    KeyboardArrowDown,
} from '@mui/icons-material';
import { editor } from 'monaco-editor';

import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks, usePixel } from '@/hooks';
import { QueryImportCellDef } from './config';

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

const FRAME_TYPES = {
    NATIVE: {
        display: 'GRID',
        value: 'NATIVE',
    },
    PY: {
        display: 'Python',
        value: 'PY',
    },
    R: {
        display: 'R',
        value: 'R',
    },
    GRID: {
        display: 'Grid',
        value: 'GRID',
    },
};

const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ disabled }) => ({
    position: 'relative',
    width: '100%',
    pointerEvents: disabled ? 'none' : 'unset',
}));

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.divider}`,
}));

const StyledButtonLabel = styled('span', {
    shouldForwardProp: (prop) => prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
    width: theme.spacing(width),
    display: 'block',
    textAlign: 'start',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
    '.MuiList-root': {
        padding: 0,
    },
}));

const StyledContainer = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5),
}));

// TODO:: Refactor height to account for Layout
export const QueryImportCellInput: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const editorRef = useRef(null);

    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const [frameVariableName, setFrameVariableName] = useState<string>('');

    // track the popover menu
    const [menuAnchorEle, setMenuAnchorEle] = useState<null | HTMLElement>(
        null,
    );
    const isMenuOpen = Boolean(menuAnchorEle);
    const [menuType, setMenuType] = useState<'database' | 'frame' | 'variable'>(
        null,
    );

    const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
        loading: true,
        ids: [],
        display: {},
    });
    const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['DATABASE']);`,
    );
    useEffect(() => {
        if (myDbs.status !== 'SUCCESS') {
            return;
        }

        const dbIds: string[] = [];
        const dbDisplay = {};
        myDbs.data.forEach((db) => {
            dbIds.push(db.app_id);
            dbDisplay[db.app_id] = db.app_name;
        });
        setCfgLibraryDatabases({
            loading: false,
            ids: dbIds,
            display: dbDisplay,
        });

        if (!cell.cellType.parameters.databaseId && dbIds.length) {
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.databaseId',
                    value: dbIds[0],
                },
            });
        }
    }, [myDbs.status, myDbs.data]);

    /**
     * Handle mounting of the editor
     *
     * @param editor - editor that mounted
     * @param monaco - monaco instance
     */
    const handleEditorMount = (
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) => {
        editorRef.current = editor;

        // add on change
        let ignoreResize = false;
        editor.onDidContentSizeChange(() => {
            try {
                // set the ignoreResize flag
                if (ignoreResize) {
                    return;
                }
                ignoreResize = true;

                resizeEditor();
            } finally {
                ignoreResize = false;
            }
        });

        // update the action
        editor.addAction({
            id: 'run',
            label: 'Run',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: (editor) => {
                const newValue = editor.getValue();

                // update with the new code
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                        path: 'parameters.selectQuery',
                        value: newValue,
                    },
                });

                state.dispatch({
                    message: ActionMessages.RUN_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                    },
                });
            },
        });

        // resize the editor
        resizeEditor();
    };

    /**
     * Resize the editor
     */
    const resizeEditor = () => {
        // set the initial height
        let height = 0;

        // if expanded scale to lines, but do not go over the max height
        if (isExpanded) {
            height = Math.min(
                editorRef.current.getContentHeight(),
                EDITOR_MAX_HEIGHT,
            );
        }

        // add the trailing line
        height += EDITOR_LINE_HEIGHT;

        editorRef.current.layout({
            width: editorRef.current.getContainerDomNode().clientWidth,
            height: height,
        });
    };

    /**
     * Handle changes in the editor
     * @param newValue - newValue
     * @returns
     */
    const handleEditorChange = (newValue: string) => {
        if (cell.isLoading) {
            return;
        }

        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: 'parameters.selectQuery',
                value: newValue,
            },
        });
    };

    /**
     * Close the Language menu
     */
    const handleMenuClose = () => {
        setMenuAnchorEle(null);
    };

    return (
        <StyledContent disabled={!isExpanded}>
            <Stack direction="column" spacing={1}>
                <Stack direction="row">
                    <StyledButton
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen ? 'true' : undefined}
                        variant="outlined"
                        disableElevation
                        disabled={cell.isLoading}
                        size="small"
                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                            event.preventDefault();
                            setMenuType('database');
                            setMenuAnchorEle(event.currentTarget);
                        }}
                        startIcon={<AccountTree />}
                        endIcon={<KeyboardArrowDown />}
                        title="Select Database"
                    >
                        <StyledButtonLabel width={8}>
                            {cfgLibraryDatabases.display[
                                cell.parameters.databaseId as string
                            ] ?? ''}
                        </StyledButtonLabel>
                    </StyledButton>
                </Stack>
                <StyledContainer>
                    <Editor
                        value={cell.parameters.selectQuery}
                        defaultValue="--SELECT * FROM..."
                        language="sql" /** TODO: language support? can we tell this from the database type? */
                        options={{
                            lineNumbers: 'on',
                            readOnly: false,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineHeight: EDITOR_LINE_HEIGHT,
                            overviewRulerBorder: false,
                        }}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                    />
                </StyledContainer>
                <Stack
                    direction="row"
                    alignItems={'center'}
                    justifyContent={'flex-end'}
                >
                    <StyledButton
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen ? 'true' : undefined}
                        variant="outlined"
                        disableElevation
                        disabled={cell.isLoading}
                        size="small"
                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                            event.preventDefault();
                            setMenuType('frame');
                            setMenuAnchorEle(event.currentTarget);
                        }}
                        startIcon={<CropFree />}
                        endIcon={<KeyboardArrowDown />}
                        title="Select Frame Type"
                    >
                        <StyledButtonLabel width={6}>
                            {FRAME_TYPES[cell.parameters.frameType]?.display ??
                                ''}
                        </StyledButtonLabel>
                    </StyledButton>
                    <StyledButton
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen ? 'true' : undefined}
                        variant="outlined"
                        disableElevation
                        disabled={cell.isLoading}
                        size="small"
                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                            event.preventDefault();
                            setMenuType('variable');
                            setMenuAnchorEle(event.currentTarget);
                        }}
                        startIcon={<DriveFileRenameOutline />}
                        title="Set Frame Variable Name"
                    >
                        <StyledButtonLabel width={14}>
                            {cell.parameters.frameVariableName ?? ''}
                        </StyledButtonLabel>
                    </StyledButton>
                </Stack>
            </Stack>
            <StyledMenu
                anchorEl={menuAnchorEle}
                open={isMenuOpen}
                onClose={handleMenuClose}
            >
                {menuType === 'database' && (
                    <List dense>
                        {Array.from(cfgLibraryDatabases.ids, (databaseId) => (
                            <List.Item
                                disablePadding
                                key={`${cell.id}-${databaseId}`}
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.databaseId',
                                                value: databaseId,
                                            },
                                        });
                                        handleMenuClose();
                                    }}
                                >
                                    <List.ItemText
                                        primary={
                                            cfgLibraryDatabases.display[
                                                databaseId
                                            ] ?? ''
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        ))}
                    </List>
                )}
                {menuType === 'frame' && (
                    <List dense>
                        {Object.values(FRAME_TYPES).map((frame) => (
                            <List.Item
                                disablePadding
                                key={`${cell.id}-${frame.value}`}
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.frameType',
                                                value: frame.value,
                                            },
                                        });
                                        handleMenuClose();
                                    }}
                                >
                                    <List.ItemText primary={frame.display} />
                                </List.ItemButton>
                            </List.Item>
                        ))}
                    </List>
                )}
                {menuType === 'variable' && (
                    <Stack direction="row" alignItems="center" padding={1.5}>
                        <TextField
                            value={frameVariableName}
                            size="small"
                            label="Frame Variable Name"
                            onChange={(e) =>
                                setFrameVariableName(e.target.value)
                            }
                        />
                        <Button
                            variant="text"
                            onClick={() => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.frameVariableName',
                                        value: frameVariableName,
                                    },
                                });
                                handleMenuClose();
                            }}
                        >
                            Save
                        </Button>
                    </Stack>
                )}
            </StyledMenu>
        </StyledContent>
    );
};
