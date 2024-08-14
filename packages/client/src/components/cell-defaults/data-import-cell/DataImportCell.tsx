import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { StyledSelect, StyledSelectItem } from '../shared';
import Editor, { Monaco } from '@monaco-editor/react';
import {
    styled,
    Button,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    Tooltip,
    Stack,
    Modal,
} from '@semoss/ui';

import {
    CropFree,
    KeyboardArrowDown,
    DriveFileRenameOutlineRounded,
    CalendarViewMonth,
    JoinInner,
    JoinRight,
    JoinLeft,
    JoinFull,
    Edit,
} from '@mui/icons-material';
import { ActionMessages, CellComponent, CellDef } from '@/stores';
import { DataImportFormModal } from '../../notebook/DataImportFormModal';
import { useBlocks, usePixel } from '@/hooks';
import { editor } from 'monaco-editor';

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

const JOIN_ICONS = {
    inner: <JoinInner />,
    'right.outer': <JoinRight />,
    'left.outer': <JoinLeft />,
    outer: <JoinFull />,
};

const BlueStyledJoinDiv = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.primary.selected,
    padding: '0px 12px',
    borderRadius: '12px',
    fontSize: '12.5px',
    border: 'none',
    color: 'black',
    cursor: 'default',
    fontWeight: '500',
}));

const GreenStyledJoinDiv = styled('div')(({ theme }) => ({
    border: 'none',
    padding: '0px 12px',
    backgroundColor: '#DEF4F3',
    borderRadius: '12px',
    fontSize: '12.5px',
    color: 'black',
    cursor: 'default',
    fontWeight: '500',
}));

const StyledJoinTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
    marginRight: '12.5px',
    marginLeft: '12.5px',
    cursor: 'default',
}));

const StyledModalTitleWrapper2 = styled(Modal.Title)(({ theme }) => ({
    alignContent: 'center',
    display: 'flex',
    padding: '0px',
}));

const StyledTableTitleBubble = styled('div')(({ theme }) => ({
    marginTop: '0px',
    marginRight: '15px',
    width: 'fit-content',
    backgroundColor: '#F1E9FB',
    padding: '7.5px 17.5px',
    display: 'inline-flex',
    borderRadius: '10px',
    alignItems: 'center',
    fontWeight: '400',
    fontSize: '12.5px',
    cursor: 'default',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-root': {
        color: theme.palette.text.secondary,
        gap: theme.spacing(1),
        display: 'flex',
        height: '30px',
        width: '200px',
    },
}));

const StyledContainer = styled('div')(({ theme }) => ({}));

interface JoinObject {
    id: string;
    joinType: string;
    leftTable: string;
    rightTable: string;
    rightKey: string;
    leftKey: string;
}

// TODO add filters and summaries
// interface FilterObject {
//     // structure for filters
// }
// interface summaryObject {
//     // structure for summaries
// }

export interface DataImportCellDef extends CellDef<'data-import'> {
    widget: 'data-import';
    parameters: {
        databaseId: string;
        frameType: 'NATIVE' | 'PY' | 'R' | 'GRID' | 'PIXEL';
        frameVariableName: string;
        selectQuery: string;
        rootTable: string;
        selectedColumns: string[];
        columnAliases: string[];
        tableNames: string[];
        joins: JoinObject[];

        // TODO add filters and summaries
        // filters: FilterObject[];
        // summaries: FilterObject[];
    };
}

// TODO:: Refactor height to account for Layout
export const DataImportCell: CellComponent<DataImportCellDef> = observer(
    (props) => {
        const editorRef = useRef(null);
        const [showStyledView, setShowStyledView] = useState(true);
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const [isDataImportModalOpen, setIsDataImportModalOpen] =
            useState(false);

        const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
            loading: true,
            display: {},
            ids: [],
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
                display: dbDisplay,
                ids: dbIds,
            });

            if (!cell.parameters.databaseId && dbIds.length) {
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        path: 'parameters.databaseId',
                        queryId: cell.query.id,
                        cellId: cell.id,
                        value: dbIds[0],
                    },
                });
            }
        }, [myDbs.status, myDbs.data]);

        /**
         * Handle mounting of the editor
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
                            path: 'parameters.selectQuery',
                            queryId: cell.query.id,
                            cellId: cell.id,
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
                    'editor.background': '#FAFAFA',
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
         * Handle changes in the editor - currently not in use, will need work if edits are enabled
         * @param newValue - newValue
         * @returns
         */
        const handleEditorChange = (newValue: string) => {
            console.log('handleEditorChange');
            if (cell.isLoading) {
                return;
            }

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    value: newValue,
                    path: 'parameters.selectQuery',
                    queryId: cell.query.id,
                    cellId: cell.id,
                },
            });
        };

        const openEditModal = () => {
            setIsDataImportModalOpen(true);
        };

        return (
            <StyledContent>
                <Stack direction="column" spacing={1}>
                    {isExpanded && (
                        <Stack direction={'column'}>
                            <Stack
                                justifyContent={'space-between'}
                                direction="row"
                            >
                                <StyledSelect
                                    value={cell.parameters.databaseId}
                                    title={'Database Not Editable'}
                                    variant="standard"
                                    disabled={true}
                                    size={'small'}
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
                                                path: 'parameters.databaseId',
                                                queryId: cell.query.id,
                                                cellId: cell.id,
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
                                    alignItems: 'center',
                                    paddingBottom: '0',
                                    marginBottom: '0',
                                    display: 'flex',
                                }}
                            >
                                {cell.parameters.tableNames &&
                                    cell.parameters.tableNames.map(
                                        (tableName) => (
                                            <Tooltip
                                                title={`${tableName} Table`}
                                            >
                                                <StyledTableTitleBubble>
                                                    <CalendarViewMonth
                                                        fontSize="small"
                                                        sx={{
                                                            strokeWidth: 0.025,
                                                            marginLeft: '-3px',
                                                            marginRight: '7px',
                                                            color: '#95909C',
                                                        }}
                                                    />
                                                    {tableName}
                                                </StyledTableTitleBubble>
                                            </Tooltip>
                                        ),
                                    )}
                            </div>

                            {isExpanded &&
                                cell.parameters.joins &&
                                cell.parameters.joins.map((join) => (
                                    <Stack
                                        spacing={1}
                                        direction="column"
                                        sx={{
                                            display: 'block',
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
                                                    title={`${join.joinType} join`}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        color="secondary"
                                                        sx={{
                                                            marginLeft: '7.5px',
                                                            marginRight:
                                                                '7.5px',
                                                        }}
                                                    >
                                                        {
                                                            JOIN_ICONS[
                                                                join.joinType
                                                            ]
                                                        }
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
                                        </StyledModalTitleWrapper2>
                                    </Stack>
                                ))}
                        </>
                    ) : (
                        <StyledContainer>
                            <Editor
                                // value is appended to make pixel valid for copy / paste to other pixel cell
                                // value=
                                defaultValue={
                                    cell.parameters.selectQuery.slice(0, -1) +
                                    ` | Import ( frame = [ CreateFrame ( frameType = [ \"${cell.parameters.frameType}\" ] , override = [ true ] ) .as ( [ \"${cell.parameters.frameVariableName}\" ] ) ] ) ; Frame ( frame = [ \"${cell.parameters.frameVariableName}\" ] ) | QueryAll ( ) | Limit ( 20 ) | CollectAll ( ) ;`
                                }
                                language="pixel"
                                options={{
                                    scrollbar: {
                                        alwaysConsumeMouseWheel: false,
                                    },
                                    lineHeight: EDITOR_LINE_HEIGHT,
                                    scrollBeyondLastLine: false,
                                    overviewRulerBorder: false,
                                    minimap: { enabled: false },
                                    lineNumbersMinChars: 2,
                                    automaticLayout: true,
                                    glyphMargin: false,
                                    lineNumbers: 'on',
                                    readOnly: true,
                                    folding: false,
                                }}
                                onChange={handleEditorChange}
                                onMount={handleEditorMount}
                            />
                        </StyledContainer>
                    )}
                    {isExpanded && (
                        <Stack
                            justifyContent={'flex-end'}
                            alignItems={'center'}
                            paddingTop={'0px'}
                            direction="row"
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
                                // disabled={cell.isLoading || !showStyledView}
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
                                            path: 'parameters.frameType',
                                            queryId: cell.query.id,
                                            cellId: cell.id,
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
                                // disabled={cell.isLoading || !showStyledView}
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
                                            path: 'parameters.frameVariableName',
                                            queryId: cell.query.id,
                                            value: e.target.value,
                                            cellId: cell.id,
                                        },
                                    });
                                }}
                            />
                        </Stack>
                    )}
                </Stack>
                {isDataImportModalOpen && (
                    <DataImportFormModal
                        setIsDataImportModalOpen={setIsDataImportModalOpen}
                        query={cell.query}
                        previousCellId={null}
                        editMode={true}
                        cell={cell}
                    />
                )}
            </StyledContent>
        );
    },
);
