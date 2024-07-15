import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { StyledSelect, StyledSelectItem } from '../shared';
import {
    styled,
    Button,
    Menu,
    MenuProps,
    TextField,
    Stack,
    InputAdornment,
    Typography,
    Tooltip,
    Modal,
    IconButton,
} from '@semoss/ui';

import {
    AccountTree,
    CropFree,
    KeyboardArrowDown,
    DriveFileRenameOutlineRounded,
    CalendarViewMonth,
    JoinInner,
    Edit,
} from '@mui/icons-material';
import { editor } from 'monaco-editor';
import { DatabaseTables } from './DatabaseTables';

import { ActionMessages, CellComponent, CellDef } from '@/stores';
import { useBlocks, usePixel } from '@/hooks';

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

const FRAME_TYPES = {
    PIXEL: {
        display: 'Pixel',
        value: 'PIXEL',
    },
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

const BlueStyledJoinDiv = styled('div')(({ theme }) => ({
    border: 'none',
    padding: '0px 12px',
    borderRadius: '12px',
    fontSize: '12.5px',
    color: 'black',
    cursor: 'default',
    backgroundColor: theme.palette.primary.selected,
    fontWeight: '500',
}));

const GreenStyledJoinDiv = styled('div')(({ theme }) => ({
    border: 'none',
    padding: '0px 12px',
    borderRadius: '12px',
    fontSize: '12.5px',
    color: 'black',
    cursor: 'default',
    backgroundColor: '#DEF4F3',
    fontWeight: '500',
}));

const PurpleStyledJoinDiv = styled('div')(({ theme }) => ({
    border: 'none',
    padding: '0px 12px',
    borderRadius: '12px',
    fontSize: '12.5px',
    color: '#BAB4C2',
    cursor: 'default',
    backgroundColor: '#F1E9FB',
    fontWeight: '500',
}));

const StyledJoinTypography = styled(Typography)(({ theme }) => ({
    marginLeft: '12.5px',
    marginRight: '12.5px',
    color: theme.palette.secondary.dark,
    cursor: 'default',
}));

const StyledModalTitleWrapper2 = styled(Modal.Title)(({ theme }) => ({
    display: 'flex',
    alignContent: 'center',
    padding: '0px',
    // justifyContent: 'space-between',
}));

const TableIconButton = styled(Tooltip)(({ theme }) => ({
    marginLeft: '-3px',
    marginRight: '7px',
    color: theme.palette.primary.main,
    // color: 'black',
}));

const StyledTableTitleBubble = styled('div')(({ theme }) => ({
    marginTop: '0px',
    // marginBottom: '15px',
    // marginLeft: '15px',
    marginRight: '15px',
    // backgroundColor: theme.palette.primary.selected,
    backgroundColor: '#F1E9FB',
    width: 'fit-content',
    padding: '7.5px 17.5px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'default',
    fontSize: '12.5px',
    fontWeight: '400',
}));

const StyledJoinElementBlueBubble = styled(Typography)(({ theme }) => ({
    marginTop: '0px',
    marginBottom: '15px',
    // marginLeft: '15px',
    marginRight: '15px',
    backgroundColor: theme.palette.primary.selected,
    width: 'fit-content',
    padding: '10px 20px',
    borderRadius: '10px',
    // display: 'block',
    // alignItems: 'center',
    cursor: 'default',
    fontSize: '12.5px',
}));

const StyledBlueDiv = styled('div')(({ theme }) => ({
    padding: '5px 10px',
    borderRadius: '12px',
    // backgroundColor: '#F1E9FB', // light purple
    backgroundColor: theme.palette.primary.selected,
    fontSize: '13px',
    textAlign: 'center',
    width: 'fit-content',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    width: '100%',
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

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-root': {
        color: theme.palette.text.secondary,
        display: 'flex',
        gap: theme.spacing(1),
        height: '30px',
        width: '200px',
    },
}));

const StyledContainer = styled('div')(({ theme }) => ({}));

interface JoinObject {
    //     table1: string;
    //     table2: string;
    //     key1: string;
    //     key2: string;
    //     joinType: string;
    id: string;
    joinType: string;
    leftKey: string;
    leftTable: string;
    rightKey: string;
    rightTable: string;
}

interface FilterObject {
    // structure for filters tbd
}

export interface DataImportCellDef extends CellDef<'data-import'> {
    widget: 'data-import';
    parameters: {
        /** Database associated with the cell */
        databaseId: string;

        /** Output frame type */
        frameType: 'NATIVE' | 'PY' | 'R' | 'GRID' | 'PIXEL';

        /** Ouput variable name */
        frameVariableName: string;

        /** Select query rendered in the cell */
        selectQuery: string;

        /** Select query rendered in the cell */
        // parameters: {
        foo: string;
        // }

        tableNames: string[];

        joins: JoinObject[];

        // filters will be added later
        // filters: FilterObject[];
    };
}

// TODO:: Refactor height to account for Layout
export const DataImportCell: CellComponent<DataImportCellDef> = observer(
    (props) => {
        const editorRef = useRef(null);

        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const [showTables, setShowTables] = useState(false);
        const [showStyledView, setShowStyledView] = useState(true);

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

            if (!cell.parameters.databaseId && dbIds.length) {
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

            monaco.editor.defineTheme('custom-theme', {
                base: 'vs',
                inherit: false,
                rules: [],
                colors: {
                    'editor.background': '#FAFAFA', // Background color
                    // 'editor.lineHighlightBorder': '#FFF', // Border around selected line
                },
            });

            monaco.editor.setTheme('custom-theme');

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

        const openEditModal = () => {
            alert('openEditModal');
            console.log({
                databaseId: cell.parameters.databaseId,
                tableNames: cell.parameters.tableNames,
                joins: cell.parameters.joins,
            });
        };

        return (
            <StyledContent>
                <Stack direction="column" spacing={1}>
                    {isExpanded && (
                        <Stack direction={'column'}>
                            <Stack
                                direction="row"
                                justifyContent={'space-between'}
                            >
                                <StyledSelect
                                    size={'small'}
                                    variant="standard"
                                    disabled={true}
                                    title={'Database Not Editable'}
                                    value={cell.parameters.databaseId}
                                    SelectProps={{
                                        IconComponent: KeyboardArrowDown,
                                    }}
                                    InputProps={{
                                        disableUnderline: true,
                                    }}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.databaseId',
                                                value: value,
                                            },
                                        });
                                    }}
                                >
                                    {Array.from(
                                        cfgLibraryDatabases.ids,
                                        (databaseId, i) => (
                                            <StyledSelectItem
                                                key={`${i}-${cell.id}-${databaseId}`}
                                                value={databaseId}
                                            >
                                                {cfgLibraryDatabases.display[
                                                    databaseId
                                                ] ?? ''}
                                            </StyledSelectItem>
                                        ),
                                    )}
                                </StyledSelect>
                                <Button
                                    variant={'text'}
                                    color={'secondary'}
                                    onClick={() => {
                                        openEditModal();
                                    }}
                                    startIcon={<Edit />}
                                >
                                    Edit
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                    {showStyledView ? (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '0',
                                    paddingBottom: '0',
                                }}
                            >
                                {/* <Typography variant='body1' sx={{ display: 'inline-block', paddingBottom: '20px' }}>
                                    Data from: 
                                </Typography> */}
                                {cell.parameters.tableNames &&
                                    cell.parameters.tableNames.map(
                                        (tableName) => (
                                            // <Tooltip title="Table">
                                            //     <StyledTableTitleBubble
                                            //         variant="body1"
                                            //         // title="Table"
                                            //     >
                                            //         <TableIconButton
                                            //             title={'Table'}
                                            //             placement="top"
                                            //         >
                                            //             <CalendarViewMonth fontSize="medium" sx={{ stroke: "#ffffff", strokeWidth: 1 }} />
                                            //         </TableIconButton>
                                            //         {tableName}
                                            //         </StyledTableTitleBubble>
                                            // </Tooltip>
                                            <Tooltip
                                                title={`${tableName} Table`}
                                            >
                                                {/* <> */}
                                                <StyledTableTitleBubble>
                                                    <CalendarViewMonth
                                                        fontSize="small"
                                                        sx={{
                                                            // stroke: "#BAB4C2",
                                                            color: '#95909C',
                                                            strokeWidth: 0.025,
                                                            marginLeft: '-3px',
                                                            marginRight: '7px',
                                                        }}
                                                    />
                                                    {tableName}
                                                </StyledTableTitleBubble>
                                                {/* </> */}
                                            </Tooltip>
                                        ),
                                    )}
                            </div>

                            {/* stack for user-added joins filters and summaries */}
                            {isExpanded &&
                                cell.parameters.joins &&
                                cell.parameters.joins.map(
                                    (join, stackIndex) => (
                                        <Stack
                                            spacing={1}
                                            direction="column"
                                            sx={{
                                                // backgroundColor: '#FAFAFA',
                                                // padding: '16px 16px 16px 16px',
                                                // marginBottom: '15px',
                                                display: 'block',
                                                // border: '1px solid red',
                                            }}
                                        >
                                            <StyledModalTitleWrapper2>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Tooltip title="Left Join Table">
                                                        <BlueStyledJoinDiv>
                                                            {join.leftTable}
                                                        </BlueStyledJoinDiv>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={`${'Inner Join'}`}
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            color="secondary"
                                                            sx={{
                                                                marginLeft:
                                                                    '7.5px',
                                                                marginRight:
                                                                    '7.5px',
                                                            }}
                                                        >
                                                            <JoinInner />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Right Join Table">
                                                        <GreenStyledJoinDiv>
                                                            {join.rightTable}
                                                        </GreenStyledJoinDiv>
                                                    </Tooltip>

                                                    <StyledJoinTypography variant="body1">
                                                        ON
                                                    </StyledJoinTypography>

                                                    <Tooltip title="Left Join Key">
                                                        <BlueStyledJoinDiv>
                                                            {join.leftKey}
                                                        </BlueStyledJoinDiv>
                                                    </Tooltip>

                                                    <StyledJoinTypography variant="body1">
                                                        =
                                                    </StyledJoinTypography>

                                                    <Tooltip title="Right Join Key">
                                                        <GreenStyledJoinDiv>
                                                            {join.rightKey}
                                                        </GreenStyledJoinDiv>
                                                    </Tooltip>
                                                </div>
                                                {/* <div>
                                            <IconButton
                                                size="small"
                                                color="secondary"
                                                onClick={() => {
                                                    removeStack(stackIndex);
                                                }}
                                            >
                                                <Close />
                                            </IconButton>
                                        </div> */}
                                            </StyledModalTitleWrapper2>
                                        </Stack>
                                    ),
                                )}
                        </>
                    ) : (
                        <StyledContainer>
                            <Editor
                                value={cell.parameters.selectQuery}
                                defaultValue=""
                                language="pixel" /** TODO: language support? can we tell this from the database type? */
                                options={{
                                    scrollbar: {
                                        alwaysConsumeMouseWheel: false,
                                    },
                                    readOnly: false,
                                    // readOnly: true,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                    lineHeight: EDITOR_LINE_HEIGHT,
                                    overviewRulerBorder: false,
                                    lineNumbers: 'on',
                                    glyphMargin: false,
                                    folding: false,
                                    lineNumbersMinChars: 2,
                                }}
                                onChange={handleEditorChange}
                                onMount={handleEditorMount}
                            />
                        </StyledContainer>
                    )}
                    {isExpanded && (
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            justifyContent={'flex-end'}
                            paddingTop={'0px'}
                        >
                            <Button
                                variant={'text'}
                                color={'primary'}
                                size={'small'}
                                onClick={() => {
                                    setShowStyledView(!showStyledView);
                                }}
                            >
                                {showStyledView ? 'Show' : 'Hide'} Pixel
                            </Button>

                            <StyledSelect
                                size={'small'}
                                disabled={cell.isLoading}
                                title={'Select Type'}
                                value={cell.parameters.frameType}
                                SelectProps={{
                                    IconComponent: KeyboardArrowDown,
                                    style: {
                                        height: '30px',
                                        width: '140px',
                                    },
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CropFree />
                                        </InputAdornment>
                                    ),
                                }}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    state.dispatch({
                                        message: ActionMessages.UPDATE_CELL,
                                        payload: {
                                            queryId: cell.query.id,
                                            cellId: cell.id,
                                            path: 'parameters.frameType',
                                            value: value,
                                        },
                                    });
                                }}
                            >
                                {Object.values(FRAME_TYPES).map((frame, i) => (
                                    <StyledSelectItem
                                        key={`${i}-${cell.id}-${frame.value}`}
                                        value={frame.value}
                                    >
                                        {frame.display}
                                    </StyledSelectItem>
                                ))}
                            </StyledSelect>
                            <StyledTextField
                                title="Set Frame Variable Name"
                                value={cell.parameters.frameVariableName}
                                disabled={cell.isLoading}
                                InputProps={{
                                    startAdornment: (
                                        <DriveFileRenameOutlineRounded />
                                    ),
                                }}
                                onChange={(e) => {
                                    state.dispatch({
                                        message: ActionMessages.UPDATE_CELL,
                                        payload: {
                                            queryId: cell.query.id,
                                            cellId: cell.id,
                                            path: 'parameters.frameVariableName',
                                            value: e.target.value,
                                        },
                                    });
                                }}
                            />
                        </Stack>
                    )}
                </Stack>
            </StyledContent>
        );
    },
);
